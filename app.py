from flask import Flask, render_template, request, redirect
import sqlite3
import os

app = Flask(__name__)
DB_NAME = "db/exercises.db"

# Create DB if not exists
def init_db():
    if not os.path.exists(DB_NAME):
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE exercises (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            name TEXT NOT NULL,
                            reps INTEGER NOT NULL,
                            sets INTEGER NOT NULL,
                            date TEXT
                        )''')
        conn.commit()
        conn.close()

@app.route('/')
def index():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exercises")
    exercises = cursor.fetchall()
    conn.close()
    return render_template("index.html", exercises=exercises)

@app.route('/add', methods=['GET', 'POST'])
def add_exercise():
    if request.method == 'POST':
        name = request.form['name']
        reps = request.form['reps']
        sets = request.form['sets']
        date = request.form['date']
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO exercises (name, reps, sets, date) VALUES (?, ?, ?, ?)", (name, reps, sets, date))
        conn.commit()
        conn.close()
        return redirect('/')
    return render_template("add_exercise.html")

@app.route('/delete/<int:id>', methods=['POST'])
def delete_exercise(id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM exercises WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect('/')


@app.route('/calendar')
def calendar():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT name, date FROM exercises WHERE date IS NOT NULL")
    events = [{"title": row[0], "start": row[1]} for row in cursor.fetchall()]
    conn.close()
    return render_template("calendar.html", events=events)


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
