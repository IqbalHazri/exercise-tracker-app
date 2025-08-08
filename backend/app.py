from flask import Flask, request, jsonify, session
from flask_session import Session
from flask_cors import CORS
from functools import wraps
import mysql.connector
import os
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

app = Flask(__name__)

app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-unsafe")
ACCESS_CODE = os.getenv("ACCESS_CODE", "")

app.config["SESSION_TYPE"] = "filesystem"  # Can also use 'redis' later
app.config["SESSION_FILE_DIR"] = "/app/flask_sessions"
app.config["SESSION_PERMANENT"] = True
app.config["SESSION_COOKIE_NAME"] = "exercise_session"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.permanent_session_lifetime = timedelta(hours=int(os.getenv("SESSION_HOURS", "6")))

Session(app)

CORS(app, supports_credentials=True, origins=os.getenv("CORS_ORIGIN").split(","))


# --- MySQL Connection ---
db_config = {
    "host": os.environ.get("DB_HOST", "127.0.0.1"),
    "user": os.environ.get("DB_USER", "user"),
    "password": os.environ.get("DB_PASSWORD", "pass"),
    "database": os.environ.get("DB_NAME", "exercise_db")
}


def get_db_connection():
    return mysql.connector.connect(**db_config)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get("authenticated"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
def home():
    return {"message": "Backend is running!"}

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    code = data.get("code")

    if code == ACCESS_CODE:
        session["authenticated"] = True
        print("[DEBUG] Session set:", session.get("authenticated"))
        return jsonify({"success": True, "message": "Login successful"})
    return jsonify({"success": False, "message": "Invalid code"}), 401

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route("/check-auth", methods=["GET"])
def check_auth():
    print("[DEBUG] Session check:", session.get("authenticated"))
    return jsonify({"authenticated": session.get("authenticated", False)})

# --- Protected Routes ---
@app.route("/exercises", methods=["GET"])
@login_required
def get_exercises():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises")
    rows = cursor.fetchall()
    conn.close()
    return jsonify(rows)

@app.route("/exercises", methods=["POST"])
@login_required
def add_exercise():
    data = request.json
    name = data.get("name")
    reps = data.get("reps")
    sets = data.get("sets")
    duration = data.get("duration")
    date = data.get("date")

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO exercises (name, reps, sets, duration, date) VALUES (%s, %s, %s, %s, %s)",
        (name, reps, sets, duration, date)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Exercise added successfully"})

@app.route("/exercises/<int:exercise_id>", methods=["DELETE"])
@login_required
def delete_exercise(exercise_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM exercises WHERE id = %s", (exercise_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Exercise deleted successfully"})

@app.route("/statistics", methods=["GET"])
@login_required
def get_statistics():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Sum duration per day
    cursor.execute("""
        SELECT DATE(date) as day, SUM(duration) as total_minutes
        FROM exercises
        WHERE date >= CURDATE() - INTERVAL 6 DAY
        GROUP BY day
        ORDER BY day
    """)
    data = {str(row[0]): row[1] for row in cursor.fetchall()}
    # Generate last 7 days and fill missing data with 0
    today = datetime.today().date()
    last_7_days = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]

    daily = [{"label": d, "minutes": data.get(d, 0)} for d in last_7_days]

    # Sum duration per week
    cursor.execute("""
        SELECT 
            YEARWEEK(date, 1) AS yw,
            STR_TO_DATE(CONCAT(YEARWEEK(MIN(date), 1), ' Monday'), '%X%V %W') AS week_start,
            SUM(duration) AS total_minutes
        FROM exercises
        GROUP BY YEARWEEK(date, 1)
        ORDER BY YEARWEEK(date, 1) DESC
        LIMIT 4
    """)

    fetched_weeks = cursor.fetchall()

    # Build dictionary of weeks -> minutes
    week_data = {}
    for row in fetched_weeks:
        if row[1]:
            week_data[row[0]] = {
                "start": row[1],
                "minutes": row[2] or 0
            }

    # Generate last 4 ISO weeks (including current)
    weekly = []
    today = datetime.today()
    # Find current ISO week and year
    current_year, current_week, _ = today.isocalendar()


    for i in range(3, -1, -1):  # 3 weeks ago to current week
        week_dt = today - timedelta(weeks=i)
        year, week, _ = week_dt.isocalendar()
        yw = int(f"{year}{week:02d}")

        # Determine start of the week (Monday)
        week_start_date = week_dt - timedelta(days=week_dt.weekday())
        week_end_date = week_start_date + timedelta(days=6)

        weekly.append({
            "label": f"{week_start_date.strftime('%b %d')} - {week_end_date.strftime('%b %d')}",
            "minutes": week_data.get(yw, {}).get("minutes", 0)
        })

    # --- Monthly: Always show at least 6 months ---
    cursor.execute("""
        SELECT 
            ANY_VALUE(DATE_FORMAT(date, '%Y-%m-01')) AS month_start,
            SUM(duration) AS total_minutes
        FROM exercises
        GROUP BY YEAR(date), MONTH(date)
        ORDER BY YEAR(date), MONTH(date)
    """)

    # Convert query results to dictionary: (year, month) -> minutes
    month_data = {}
    for row in cursor.fetchall():
        if row[0]:
            month_start = datetime.strptime(str(row[0]), "%Y-%m-%d")
            month_data[(month_start.year, month_start.month)] = row[1] or 0

    # Generate last 6 months (including current month) using relativedelta
    monthly = []
    today = datetime.today().replace(day=1)  # first day of current month

    for i in range(5, -1, -1):  # 5 months ago -> current month
        month_start = today - relativedelta(months=i)
        key = (month_start.year, month_start.month)

        monthly.append({
            "label": month_start.strftime("%b %Y"),  # e.g., Aug 2025
            "minutes": month_data.get(key, 0)
        })

    cursor.close()
    conn.close()

    return jsonify({
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
