import sqlite3
import json
import time
import secrets
import os # Added for path and environment variables
from functools import wraps
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import requests


# --- DEPLOYMENT CHANGES START ---

# 1. Database Path: CRITICAL CHANGE
# This points the SQLite file to the Render Persistent Disk mount path (/data).
# **You must configure a Persistent Disk with the Mount Path /data on Render.**
DATABASE = os.path.join('/data', 'pokequest.db')

# 2. API Key: CRITICAL CHANGE
# Load the API key from a secure environment variable named GEMINI_API_KEY.
# **You must set GEMINI_API_KEY in your Render environment variables.**
API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBgJZJh6k2XF6wOflzbRSU5jr5TAzeH5ig_DEV_KEY')
MODEL_NAME = "gemini-2.5-flash" 
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

# --- DEPLOYMENT CHANGES END ---


app = Flask(__name__)
CORS(app)


def get_db():
    """Connects to the specific database."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    """Closes the database connection at the end of the request."""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """Initializes the database schema."""
    with app.app_context():
        db = get_db()
        cursor = db.cursor()

        # 1. Users Table 
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                auth_token TEXT UNIQUE,      -- Token for API requests
                pokemon_name TEXT DEFAULT 'Pikachu',    
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                badges INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                last_quiz_weak_topics TEXT DEFAULT '[]'
            );
        """)
        try:
            # Check for column existence defensively
            db.execute("SELECT pokemon_name FROM users LIMIT 1")
        except sqlite3.OperationalError:
            print("Adding 'pokemon_name' column to existing users table.")
            db.execute("ALTER TABLE users ADD COLUMN pokemon_name TEXT DEFAULT 'Pikachu'")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quizzes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                subject TEXT NOT NULL,
                score INTEGER NOT NULL,
                total_questions INTEGER NOT NULL,
                weak_topics TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(user_id)
            );
        """)
        db.commit()


init_db()


def auth_required(f):
    """Decorator to check for a valid Auth Token in the request header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token is missing or malformed."}), 401

        token = auth_header.split(' ')[1]
        
        db = get_db()
        cursor = db.execute("SELECT user_id FROM users WHERE auth_token = ?", (token,))
        user = cursor.fetchone()

        if user is None:
            return jsonify({"error": "Invalid or expired token."}), 401
        
        kwargs['user_id'] = user['user_id']
        return f(*args, **kwargs)

    return decorated


def gemini_api_call(prompt, system_instruction):
    """
    Implements the actual Gemini API call logic using the 'requests' library,
    including structured JSON output and exponential backoff.
    """
    print(f"--- Calling Gemini for Quiz Generation using {MODEL_NAME} ---")
    

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "quiz_title": {"type": "STRING"},
            "questions": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "id": {"type": "NUMBER"},
                        "question": {"type": "STRING"},
                        "options": {"type": "ARRAY", "items": {"type": "STRING"}},
                        "answer": {"type": "STRING"},
                        "topic": {"type": "STRING"}
                    },
                    "propertyOrdering": ["id", "question", "options", "answer", "topic"]
                }
            }
        }
    }

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }


    MAX_RETRIES = 5
    for i in range(MAX_RETRIES):
        try:
            response = requests.post(
                API_URL, 
                headers={'Content-Type': 'application/json'}, 
                data=json.dumps(payload)
            )

            response.raise_for_status() 
            
            result = response.json()
            try:
                json_text = result['candidates'][0]['content']['parts'][0]['text']
            except (KeyError, IndexError) as e:
                print(f"Gemini API Response Structure Error: {e}. Full result: {result}")
                return {"error": "Gemini API returned an unparsable structure. Check console for details."}


            try:
                return json.loads(json_text)
            except json.JSONDecodeError as e:
                print(f"Gemini JSON Decode Error: {e}. Raw text was: {json_text}")
                return {"error": "Gemini generated non-JSON or invalid JSON output."}


        except requests.exceptions.HTTPError as e:
            error_details = response.text
            print(f"Gemini API HTTP Error: {response.status_code}. Details: {error_details}")
            
            if response.status_code in [429, 500, 503] and i < MAX_RETRIES - 1:
                delay = 2 ** i
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                return {"error": f"API Request Failed ({response.status_code}): {error_details}"}
        
        except Exception as e:
            print(f"Gemini API Network/Unexpected Error: {e}")
            return {"error": f"Failed to generate quiz due to network error: {e}"}

    return {"error": "Gemini API failed after multiple retries."}


def calculate_new_xp(current_xp, correct_answers):
    """Calculates new XP and checks for level up/evolution."""
    XP_PER_CORRECT_ANSWER = 30
    XP_REQUIRED_PER_LEVEL = 300
    
    xp_gained = correct_answers * XP_PER_CORRECT_ANSWER
    new_xp = current_xp + xp_gained

    new_level = 1 + (new_xp // XP_REQUIRED_PER_LEVEL)
    

    badges_unlocked = new_level - 1 

    return new_xp, new_level, badges_unlocked

def get_pokemon_status(name, level):
    """
    Determines the visual appearance/evolution stage of the Pokémon based on the trainer's level.
    """

    if level >= 5:
        stage = "Final Evolution"

        image_url = f"https://placehold.co/200x200/4c7cff/white?text={name}+Evo3"
    elif level >= 3:
        stage = "Middle Evolution"
        image_url = f"https://placehold.co/200x200/ff9933/white?text={name}+Evo2"
    else:
        stage = "Basic Stage"
        image_url = f"https://placehold.co/200x200/80ff80/black?text={name}+Evo1"

    return {
        "evolution_status": f"Level {level}, {stage}",
        "image_url": image_url
    }

@app.route('/api/register', methods=['POST'])
def register():
    """Registers a new user and selects their starter Pokemon."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    pokemon_name = data.get('pokemon_name') 

    if not all([username, password, pokemon_name]):
        return jsonify({"error": "Missing username, password, or pokemon_name"}), 400

    db = get_db()
    try:
        password_hash = generate_password_hash(password)
        user_id = secrets.token_urlsafe(16)
        
        db.execute(
            "INSERT INTO users (user_id, username, password_hash, pokemon_name) VALUES (?, ?, ?, ?)",
            (user_id, username, password_hash, pokemon_name)
        )
        db.commit()
        return jsonify({
            "message": "Registration successful. Please log in.",
            "user_id": user_id
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already taken."}), 409
    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {e}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates user, generates a token, and returns it."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({"error": "Missing username or password"}), 400

    db = get_db()
    cursor = db.execute(
        "SELECT user_id, password_hash, pokemon_name FROM users WHERE username = ?", (username,)
    )
    user = cursor.fetchone()

    if not user:
            return jsonify({"error": "Invalid username or password."}), 401
    
    if check_password_hash(user['password_hash'], password):
        auth_token = secrets.token_urlsafe(32)
        db.execute(
            "UPDATE users SET auth_token = ? WHERE user_id = ?", 
            (auth_token, user['user_id'])
        )
        db.commit()
        theme_to_return = "pokemon_kalos" if user['pokemon_name'] in ['Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle'] else "one_piece" 
        
        return jsonify({
            "message": "Login successful",
            "auth_token": auth_token,
            "user_id": user['user_id'],
            "theme": theme_to_return, 
            "pokemon_name": user['pokemon_name'] 
        }), 200
    
    return jsonify({"error": "Invalid username or password."}), 401


@app.route('/api/dashboard', methods=['GET'])
@auth_required
def get_dashboard(user_id):
    """Fetches user data using the token and the user_id passed by the decorator."""
    db = get_db()
    cursor = db.execute(
        "SELECT user_id, username, pokemon_name, xp, level, badges, streak, last_quiz_weak_topics FROM users WHERE user_id = ?",
        (user_id,)
    )
    user = cursor.fetchone()

    if user:
        user_dict = dict(user)
        xp_required = 300 
        
        pokemon_status = get_pokemon_status(user_dict['pokemon_name'], user_dict['level'])

        return jsonify({
            "trainer_card": {
                "user_id": user_dict['user_id'],
                "username": user_dict['username'],
                "level": user_dict['level'],
                "xp": user_dict['xp'],
                "streak": user_dict['streak']
            },
            "pokemon_panel": {
                "name": user_dict['pokemon_name'],
                "xp_stat": f"{user_dict['xp'] % xp_required}/{xp_required}", 
                "total_xp": user_dict['xp'],
                "evolution_status": pokemon_status['evolution_status'], 
                "image_url": pokemon_status['image_url'] 
            },
            "achievements": {
                "badges": user_dict['badges']
            },
            "last_weak_topics": json.loads(user_dict['last_quiz_weak_topics'])
        }), 200
    
    return jsonify({"error": "User data not found."}), 404


@app.route('/api/generate_quiz', methods=['POST'])
@auth_required
def generate_quiz(user_id):
    """
    Retrieves user weak topics, constructs the Gemini prompt, 
    calls the API, and returns the quiz.
    """
    data = request.json
    subject = data.get('subject') 
    
    if not subject:
        return jsonify({"error": "Missing subject"}), 400

    db = get_db()
    cursor = db.execute(
        "SELECT last_quiz_weak_topics, level FROM users WHERE user_id = ?", (user_id,)
    )
    user_data = cursor.fetchone()
    
    if not user_data:
        return jsonify({"error": "User data retrieval failed."}), 404

    weak_topics = json.loads(user_data['last_quiz_weak_topics'] or '[]')
    current_level = user_data['level']

    difficulty = "Intermediate (High School Level)" if current_level <= 3 else "Advanced (College Level)"
    
    weak_topics_str = ", ".join(weak_topics) if weak_topics else "General foundational concepts" 
    system_instruction = "You are an accurate and reliable PokeQuest Quiz Master. All generated questions must be factually correct, academically relevant, and strictly adhere to all safety guidelines. Your response must be a single, valid JSON object."

    prompt = f"""
        You are an expert educational content generator. Generate exactly 5 multiple-choice questions for the subject *{subject}* at an *{difficulty}* difficulty.

        *CRITICAL INSTRUCTION: GENERATE NEW QUESTIONS THE USER HAS NEVER SEEN. DO NOT REPEAT ANY QUESTIONS FROM PREVIOUS QUIZZES.*
        
        *Crucially, prioritize creating at least 3 of the 5 questions focused on the following weak topics:*
        *{weak_topics_str}*

        The output must be a single JSON object that strictly follows the schema.
    """

    quiz_data = gemini_api_call(prompt, system_instruction)

    if quiz_data.get('error'):
        return jsonify(quiz_data), 500

    return jsonify(quiz_data), 200


@app.route('/api/submit_quiz', methods=['POST'])
@auth_required
def submit_quiz(user_id):
    """Saves quiz results, updates user XP, level, and weak topics."""
    data = request.json
    subject = data.get('subject')
    score = data.get('score') 
    total_questions = data.get('total_questions')
    new_weak_topics = data.get('new_weak_topics') 

    if not all([subject, score is not None, total_questions, new_weak_topics is not None]):
        return jsonify({"error": "Missing required quiz data"}), 400

    db = get_db()
    try:
        cursor = db.execute("SELECT xp, level FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        current_xp = user['xp']
        new_xp, new_level, badges_unlocked = calculate_new_xp(current_xp, score)
        weak_topics_json = json.dumps(new_weak_topics)
        db.execute("""
            UPDATE users SET 
                xp = ?, 
                level = ?, 
                badges = ?, 
                last_quiz_weak_topics = ?
            WHERE user_id = ?
        """, (new_xp, new_level, badges_unlocked, weak_topics_json, user_id))

        db.execute("""
            INSERT INTO quizzes (user_id, subject, score, total_questions, weak_topics) 
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, subject, score, total_questions, weak_topics_json))

        db.commit()

        return jsonify({
            "message": "Quiz submitted and user data updated",
            "xp_gained": new_xp - current_xp,
            "new_xp": new_xp,
            "new_level": new_level,
            "badges_unlocked": badges_unlocked
        }), 200

    except sqlite3.Error as e:
        return jsonify({"error": f"Database error: {e}"}), 500


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Fetches top users ranked by total XP (No auth required for public view)."""
    db = get_db()
    cursor = db.execute("""
        SELECT username, pokemon_name, xp, level 
        FROM users 
        ORDER BY xp DESC 
        LIMIT 10
    """)
    leaderboard_data = [dict(row) for row in cursor.fetchall()]
    return jsonify(leaderboard_data), 200

# 3. Development server removal: Removed the `if __name__ == '__main__':` block.
# Gunicorn will import the `app` object directly when run.
