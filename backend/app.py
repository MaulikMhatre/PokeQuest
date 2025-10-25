import json
import time
import secrets
import os
from functools import wraps

# --- NEW IMPORTS FOR POSTGRESQL/SQLAlchemy ---
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import requests
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import exc
# --- END NEW IMPORTS ---


# --- DEPLOYMENT VARIABLES (LOADED FROM RENDER ENVIRONMENT) ---

# CRITICAL: Load the database URL and API Key from Render Environment Variables
DATABASE_URL = os.environ.get('DATABASE_URL') 
API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyBgJZJh6k2XF6wOflzbRSU5jr5TAzeH5ig')

MODEL_NAME = "gemini-2.5-flash" 
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={API_KEY}"

# --- END DEPLOYMENT VARIABLES ---


app = Flask(__name__)
CORS(app)

# --- FLASK-SQLALCHEMY CONFIGURATION ---
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
# --- END CONFIGURATION ---


# --- DATABASE MODELS (Representing your tables in Python) ---

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Text, primary_key=True)
    username = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    auth_token = db.Column(db.Text, unique=True)
    pokemon_name = db.Column(db.Text, default='Pikachu')
    xp = db.Column(db.Integer, default=0)
    level = db.Column(db.Integer, default=1)
    badges = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_quiz_weak_topics = db.Column(db.Text, default='[]') # Stored as JSON string

class Quiz(db.Model):
    __tablename__ = 'quizzes'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Text, db.ForeignKey('users.user_id'))
    subject = db.Column(db.Text, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    weak_topics = db.Column(db.Text) # Stored as JSON string
    timestamp = db.Column(db.DateTime, default=db.func.now())

# --- END DATABASE MODELS ---


# --- DATABASE INITIALIZATION (Creates tables in PostgreSQL if they don't exist) ---
with app.app_context():
    try:
        # This function looks at the Models above and creates the corresponding PostgreSQL tables
        db.create_all()
        print("PostgreSQL Database tables initialized successfully.")
    except Exception as e:
        # This will print an error if the DATABASE_URL is invalid or the database service isn't reachable
        print(f"ERROR: Could not connect to or initialize PostgreSQL database. {e}")

# --- END DATABASE INITIALIZATION ---


def auth_required(f):
    """Decorator to check for a valid Auth Token in the request header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token is missing or malformed."}), 401

        token = auth_header.split(' ')[1]
        
        # Using ORM to find user by token
        user = User.query.filter_by(auth_token=token).one_or_none()

        if user is None:
            return jsonify({"error": "Invalid or expired token."}), 401
        
        kwargs['user_id'] = user.user_id
        return f(*args, **kwargs)

    return decorated


def gemini_api_call(prompt, system_instruction):
    """
    Implements the actual Gemini API call logic using the 'requests' library,
    including structured JSON output and exponential backoff.
    """
    # Check if API Key is actually available from environment variables
    if not API_KEY or API_KEY == 'DEV_KEY_NOT_SET':
        return {"error": "API Key is missing. Please set GEMINI_API_KEY environment variable."}
        
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

    try:
        password_hash = generate_password_hash(password)
        user_id = secrets.token_urlsafe(16)
        
        # --- ORM INSERT/CREATE ---
        new_user = User(
            user_id=user_id,
            username=username,
            password_hash=password_hash,
            pokemon_name=pokemon_name
        )
        db.session.add(new_user)
        db.session.commit()
        # --- END ORM INSERT/CREATE ---

        return jsonify({
            "message": "Registration successful. Please log in.",
            "user_id": user_id
        }), 201
    except exc.IntegrityError:
        db.session.rollback() # Rollback session on error
        return jsonify({"error": "Username already taken."}), 409
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error during registration: {e}"}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Authenticates user, generates a token, and returns it."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({"error": "Missing username or password"}), 400

    # --- ORM SELECT ---
    user = User.query.filter_by(username=username).one_or_none()

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password."}), 401
    
    # Password checked out. Generate token and update.
    auth_token = secrets.token_urlsafe(32)
    user.auth_token = auth_token
    db.session.commit()
    # --- END ORM SELECT/UPDATE ---

    theme_to_return = "pokemon_kalos" if user.pokemon_name in ['Pikachu', 'Bulbasaur', 'Charmander', 'Squirtle'] else "one_piece" 
    
    return jsonify({
        "message": "Login successful",
        "auth_token": auth_token,
        "user_id": user.user_id,
        "theme": theme_to_return, 
        "pokemon_name": user.pokemon_name 
    }), 200


@app.route('/api/dashboard', methods=['GET'])
@auth_required
def get_dashboard(user_id):
    """Fetches user data using the token and the user_id passed by the decorator."""
    # --- ORM SELECT ---
    user = User.query.filter_by(user_id=user_id).one_or_none()

    if user:
        xp_required = 300 
        
        pokemon_status = get_pokemon_status(user.pokemon_name, user.level)

        # Retrieve weak topics, ensuring it is parsed from the TEXT field
        last_weak_topics = json.loads(user.last_quiz_weak_topics or '[]')

        return jsonify({
            "trainer_card": {
                "user_id": user.user_id,
                "username": user.username,
                "level": user.level,
                "xp": user.xp,
                "streak": user.streak
            },
            "pokemon_panel": {
                "name": user.pokemon_name,
                "xp_stat": f"{user.xp % xp_required}/{xp_required}", 
                "total_xp": user.xp,
                "evolution_status": pokemon_status['evolution_status'], 
                "image_url": pokemon_status['image_url'] 
            },
            "achievements": {
                "badges": user.badges
            },
            "last_weak_topics": last_weak_topics
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

    # --- ORM SELECT ---
    user = User.query.filter_by(user_id=user_id).one_or_none()
    
    if not user:
        return jsonify({"error": "User data retrieval failed."}), 404

    weak_topics = json.loads(user.last_quiz_weak_topics or '[]')
    current_level = user.level
    # --- END ORM SELECT ---

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

    try:
        # --- ORM SELECT and UPDATE ---
        user = User.query.filter_by(user_id=user_id).one_or_none()
        if not user:
            return jsonify({"error": "User not found."}), 404
        
        current_xp = user.xp
        new_xp, new_level, badges_unlocked = calculate_new_xp(current_xp, score)
        weak_topics_json = json.dumps(new_weak_topics)
        
        # 1. Update user record
        user.xp = new_xp
        user.level = new_level
        user.badges = badges_unlocked
        user.last_quiz_weak_topics = weak_topics_json

        # 2. Create new quiz record
        new_quiz = Quiz(
            user_id=user_id,
            subject=subject,
            score=score,
            total_questions=total_questions,
            weak_topics=weak_topics_json
        )
        
        db.session.add(new_quiz)
        db.session.commit()
        # --- END ORM UPDATE/INSERT ---

        return jsonify({
            "message": "Quiz submitted and user data updated",
            "xp_gained": new_xp - current_xp,
            "new_xp": new_xp,
            "new_level": new_level,
            "badges_unlocked": badges_unlocked
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Database error during quiz submission: {e}"}), 500


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Fetches top users ranked by total XP (No auth required for public view)."""
    # --- ORM SELECT ---
    # Fetch top 10 users by descending XP
    leaderboard_data = User.query.order_by(User.xp.desc()).limit(10).all()
    
    # Convert SQLAlchemy objects to list of dictionaries
    results = []
    for user in leaderboard_data:
        results.append({
            "username": user.username,
            "pokemon_name": user.pokemon_name,
            "xp": user.xp,
            "level": user.level
        })
    # --- END ORM SELECT ---

    return jsonify(results), 200
