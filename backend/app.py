import sqlite3
import json
import time
import secrets
from functools import wraps
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import requests # ADDED: Library for making HTTP requests

# Note: For the hackathon environment, you will need to install these:
# pip install Flask Flask-CORS requests werkzeug

# --- Configuration ---
DATABASE = 'pokequest.db'
# IMPORTANT: Replace this with your actual, FULL, 39+ character Gemini API Key
API_KEY = "AIzaSyA7esi4sf8C7hn--84JgBAYKj6_W4OkQEc"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key={API_KEY}"
# --- End Configuration ---

app = Flask(__name__)
# Enable CORS for all routes so your Next.js frontend can connect
CORS(app)

# --- Database Setup Functions ---

def get_db():
    """Connects to the specific database."""
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        # Allows accessing columns by name instead of index
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

        # 1. Users Table (Now includes Auth fields)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                auth_token TEXT UNIQUE,        -- Token for API requests
                pokemon_name TEXT NOT NULL,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                badges INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                last_quiz_weak_topics TEXT DEFAULT '[]'
            );
        """)

        # 2. Quizzes Table (History and Leaderboard Data)
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

# Call this once to create the tables
init_db()

# --- Security Decorator ---

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
        
        # Pass the user_id to the wrapped function
        kwargs['user_id'] = user['user_id']
        return f(*args, **kwargs)

    return decorated

# --- Utility Functions for Logic (Updated Gemini API Call) ---

def gemini_api_call(prompt, system_instruction):
    """
    Implements the actual Gemini API call logic using the 'requests' library,
    including structured JSON output and exponential backoff.
    """
    print(f"--- Calling Gemini for Quiz Generation ---")
    
    # Check if the API key is set correctly (must be longer than the common prefix)
    if API_KEY == "YOUR_FULL_GEMINI_API_KEY_HERE" or len(API_KEY) < 30:
         # Fallback to a mock response if the key is not set or incomplete
        time.sleep(0.5) 
        mock_response_json = {
             "quiz_title": "MOCK QUIZ (API Key Missing/Invalid)",
             "questions": [
                { "id": 1, "question": "What is the force required to accelerate a 10kg mass at 2m/s^2?", "options": ["5 N", "20 N", "12 N", "8 N"], "answer": "20 N", "topic": "Newton's Second Law" },
                { "id": 2, "question": "Vector A is 3 units east, Vector B is 4 units north. What is the magnitude of A + B?", "options": ["5 units", "7 units", "1 unit", "12 units"], "answer": "5 units", "topic": "Vector Addition" },
                { "id": 3, "question": "Calculate the molar mass of water ($H_2O$)?", "options": ["16 g/mol", "18 g/mol", "2 g/mol", "32 g/mol"], "answer": "18 g/mol", "topic": "Stoichiometry" },
                { "id": 4, "question": "Which of the following is not a primary color?", "options": ["Red", "Green", "Blue", "Yellow"], "answer": "Green", "topic": "Light and Color" },
                { "id": 5, "question": "If you are struggling with this, please check your Gemini API key.", "options": ["OK", "Will check", "Got it", "Thanks"], "answer": "Will check", "topic": "API Troubleshooting" },
             ]
        }
        print("ALERT: Using mock data because the Gemini API key is missing or invalid.")
        return mock_response_json

    # 1. Define the desired JSON structure for the quiz response
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

    # 2. Construct the API Payload
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }

    # 3. Make the API Call with Exponential Backoff
    MAX_RETRIES = 5
    for i in range(MAX_RETRIES):
        try:
            # Send the request
            response = requests.post(
                API_URL, 
                headers={'Content-Type': 'application/json'}, 
                data=json.dumps(payload)
            )
            response.raise_for_status() # Raise exception for bad status codes (4xx or 5xx)
            
            # Extract and parse the response text
            result = response.json()
            # The structured JSON is returned as a string inside the 'text' field
            json_text = result['candidates'][0]['content']['parts'][0]['text']
            
            # We parse the string back into a Python dictionary
            return json.loads(json_text)

        except requests.exceptions.HTTPError as e:
            if response.status_code == 429 and i < MAX_RETRIES - 1:
                # Handle rate limiting (429) with exponential backoff
                delay = 2 ** i
                # Note: No log printing here to adhere to non-logging retry instruction
                time.sleep(delay)
            else:
                # Re-raise or return error for other HTTP issues
                print(f"Gemini API HTTP Error: {e}")
                return {"error": f"API Request Failed ({response.status_code}): {response.text}"}
        
        except Exception as e:
            # Handle JSON parsing errors or other unexpected errors
            print(f"Gemini API Unexpected Error: {e}")
            return {"error": f"Failed to generate quiz due to internal error: {e}"}

    # If all retries fail
    return {"error": "Gemini API failed after multiple retries."}


def calculate_new_xp(current_xp, correct_answers):
    """Calculates new XP and checks for level up/evolution."""
    XP_PER_CORRECT_ANSWER = 30
    XP_REQUIRED_PER_LEVEL = 300
    
    xp_gained = correct_answers * XP_PER_CORRECT_ANSWER
    new_xp = current_xp + xp_gained

    # Simple leveling logic (adjust as needed)
    new_level = 1 + (new_xp // XP_REQUIRED_PER_LEVEL)
    
    # Badges unlocked is simply a reflection of level achieved
    badges_unlocked = new_level - 1 

    return new_xp, new_level, badges_unlocked


# ⭐ NEW: Function to determine Pokémon stage and image URL
def get_pokemon_status(name, level):
    """
    Determines the visual appearance/evolution stage of the Pokémon based on the trainer's level.
    
    NOTE: Replace the placeholder URLs with actual hosted 3D renders or sprites.
    """
    # Simple, mock evolution tiers
    if level >= 5:
        stage = "Final Evolution"
        # Placeholder for Final Stage image URL
        image_url = f"https://placehold.co/200x200/4c7cff/white?text={name}+Evo3"
    elif level >= 3:
        stage = "Middle Evolution"
        # Placeholder for Middle Stage image URL
        image_url = f"https://placehold.co/200x200/ff9933/white?text={name}+Evo2"
    else:
        stage = "Basic Stage"
        # Placeholder for Basic Stage image URL
        image_url = f"https://placehold.co/200x200/80ff80/black?text={name}+Evo1"

    return {
        "evolution_status": f"Level {level}, {stage}",
        "image_url": image_url
    }
# ⭐ END NEW FUNCTION


# --- New Authentication Endpoints ---

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
        # Use a random UUID for user_id (not just the username)
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
        "SELECT user_id, password_hash FROM users WHERE username = ?", (username,)
    )
    user = cursor.fetchone()

    if not user:
         # User not found (Return 401 instead of 404 to avoid revealing valid usernames)
         return jsonify({"error": "Invalid username or password."}), 401
    
    if check_password_hash(user['password_hash'], password):
        # Successful login: Generate and store a new token
        auth_token = secrets.token_urlsafe(32)
        db.execute(
            "UPDATE users SET auth_token = ? WHERE user_id = ?", 
            (auth_token, user['user_id'])
        )
        db.commit()
        
        return jsonify({
            "message": "Login successful",
            "auth_token": auth_token,
            "user_id": user['user_id']
        }), 200
    
    # Password mismatch
    return jsonify({"error": "Invalid username or password."}), 401

# --- Protected Data Endpoints (Updated) ---

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
        # Total XP for next level is currently 300, based on leveling logic
        xp_required = 300 
        xp_for_next_level = xp_required - (user_dict['xp'] % xp_required)
        
        # ⭐ NEW: Get the calculated status and image URL
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
                "evolution_status": pokemon_status['evolution_status'], # Updated status
                "image_url": pokemon_status['image_url'] # ⭐ NEW: Image URL for the frontend
            },
            "achievements": {
                "badges": user_dict['badges']
            },
            "last_weak_topics": json.loads(user_dict['last_quiz_weak_topics'])
        }), 200
    
    # Should not be reached if auth_required works, but good practice.
    return jsonify({"error": "User data not found."}), 404


@app.route('/api/generate_quiz', methods=['POST'])
@auth_required
def generate_quiz(user_id):
    """
    Retrieves user weak topics, constructs the Gemini prompt, 
    calls the API, and returns the quiz.
    """
    data = request.json
    subject = data.get('subject') # e.g., 'Physics', 'Chemistry', 'Math'
    
    if not subject:
        return jsonify({"error": "Missing subject"}), 400

    # 1. Fetch user's weakness data
    db = get_db()
    cursor = db.execute(
        "SELECT last_quiz_weak_topics, level FROM users WHERE user_id = ?", (user_id,)
    )
    user_data = cursor.fetchone()
    
    if not user_data:
        # Fallback for unexpected case where authenticated user data is missing
        return jsonify({"error": "User data retrieval failed."}), 404

    weak_topics = json.loads(user_data['last_quiz_weak_topics'] or '[]')
    current_level = user_data['level']
    difficulty = "Intermediate (High School Level)" if current_level <= 3 else "Advanced"
    
    weak_topics_str = ", ".join(weak_topics) if weak_topics else "General foundational concepts"

    # 2. Construct the Gemini Prompt (Same as before)
    system_instruction = "You are an accurate and reliable PokeQuest Quiz Master. All generated questions must be factually correct, academically relevant, and strictly adhere to all safety guidelines."

    prompt = f"""
        You are an expert educational content generator. Generate exactly 5 multiple-choice questions for the subject **{subject}** at an **{difficulty}** difficulty.

        **CRITICAL INSTRUCTION: GENERATE NEW QUESTIONS THE USER HAS NEVER SEEN. DO NOT REPEAT ANY QUESTIONS FROM PREVIOUS QUIZZES.**
        
        **Crucially, prioritize creating at least 3 of the 5 questions focused on the following weak topics:**
        **{weak_topics_str}**

        The output must be a single JSON object that strictly follows the schema.
    """
    
    # 3. Call the Gemini API 
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
    score = data.get('score') # correct answers count
    total_questions = data.get('total_questions')
    new_weak_topics = data.get('new_weak_topics') # List of strings from frontend analysis

    if not all([subject, score is not None, total_questions, new_weak_topics is not None]):
        return jsonify({"error": "Missing required quiz data"}), 400

    db = get_db()
    try:
        # 1. Get current user stats
        cursor = db.execute("SELECT xp, level FROM users WHERE user_id = ?", (user_id,))
        user = cursor.fetchone()
        
        current_xp = user['xp']
        new_xp, new_level, badges_unlocked = calculate_new_xp(current_xp, score)
        
        # Convert weak topics list to JSON string for storage
        weak_topics_json = json.dumps(new_weak_topics)

        # 2. Update User XP, Level, and Weak Topics
        db.execute("""
            UPDATE users SET 
                xp = ?, 
                level = ?, 
                badges = ?, 
                last_quiz_weak_topics = ?
            WHERE user_id = ?
        """, (new_xp, new_level, badges_unlocked, weak_topics_json, user_id))

        # 3. Record Quiz History
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

if __name__ == '__main__':
    print(f"Database initialized at: {DATABASE}")
    print("--- API Endpoints ---")
    print("POST /api/register -> Creates user")
    print("POST /api/login -> Returns auth_token")
    print("GET /api/dashboard -> Requires Bearer token")
    print("POST /api/generate_quiz -> Requires Bearer token")
    print("POST /api/submit_quiz -> Requires Bearer token")
    print("GET /api/leaderboard -> Public")
    app.run(debug=True)