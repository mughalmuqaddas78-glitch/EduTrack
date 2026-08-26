from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

DATABASE = "students.db"


# =========================================
# Database Connection
# =========================================

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# =========================================
# Initialize Database
# =========================================

def init_db():
    conn = get_db_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            attendance INTEGER NOT NULL,
            averageMarks INTEGER NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# =========================================
# Seed Initial Students
# =========================================

def seed_students():
    conn = get_db_connection()

    count = conn.execute(
        "SELECT COUNT(*) FROM students"
    ).fetchone()[0]

    if count == 0:
        conn.executemany("""
            INSERT INTO students (name, attendance, averageMarks)
            VALUES (?, ?, ?)
        """, [
            ("Ali", 92, 82),
            ("Sara", 78, 65),
            ("Ahmed", 54, 42)
        ])

        conn.commit()

    conn.close()


# =========================================
# Home
# =========================================

@app.route("/")
def home():
    return render_template("index.html")


# =========================================
# Get All Students
# =========================================

@app.route("/api/students", methods=["GET"])
def get_students():
    conn = get_db_connection()

    students = conn.execute("""
        SELECT id, name, attendance, averageMarks
        FROM students
        ORDER BY id
    """).fetchall()

    conn.close()

    return jsonify([dict(student) for student in students])


# =========================================
# Add New Student
# =========================================

@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    required_fields = [
        "name",
        "attendance",
        "averageMarks"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400

    name = str(data["name"]).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Student name cannot be empty"
        }), 400

    try:
        attendance = int(data["attendance"])
        average_marks = int(data["averageMarks"])
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Attendance and averageMarks must be numbers"
        }), 400

    if not 0 <= attendance <= 100:
        return jsonify({
            "success": False,
            "message": "Attendance must be between 0 and 100"
        }), 400

    if not 0 <= average_marks <= 100:
        return jsonify({
            "success": False,
            "message": "Average marks must be between 0 and 100"
        }), 400

    conn = get_db_connection()

    cursor = conn.execute("""
        INSERT INTO students (name, attendance, averageMarks)
        VALUES (?, ?, ?)
    """, (name, attendance, average_marks))

    student_id = cursor.lastrowid

    conn.commit()

    new_student = conn.execute("""
        SELECT id, name, attendance, averageMarks
        FROM students
        WHERE id = ?
    """, (student_id,)).fetchone()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Student added successfully",
        "student": dict(new_student)
    }), 201


# =========================================
# Update Student
# =========================================

@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    required_fields = [
        "name",
        "attendance",
        "averageMarks"
    ]

    for field in required_fields:
        if field not in data:
            return jsonify({
                "success": False,
                "message": f"{field} is required"
            }), 400

    name = str(data["name"]).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Student name cannot be empty"
        }), 400

    try:
        attendance = int(data["attendance"])
        average_marks = int(data["averageMarks"])
    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Attendance and averageMarks must be numbers"
        }), 400

    if not 0 <= attendance <= 100:
        return jsonify({
            "success": False,
            "message": "Attendance must be between 0 and 100"
        }), 400

    if not 0 <= average_marks <= 100:
        return jsonify({
            "success": False,
            "message": "Average marks must be between 0 and 100"
        }), 400

    conn = get_db_connection()

    existing_student = conn.execute(
        "SELECT id FROM students WHERE id = ?",
        (student_id,)
    ).fetchone()

    if not existing_student:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    conn.execute("""
        UPDATE students
        SET name = ?, attendance = ?, averageMarks = ?
        WHERE id = ?
    """, (
        name,
        attendance,
        average_marks,
        student_id
    ))

    conn.commit()

    updated_student = conn.execute("""
        SELECT id, name, attendance, averageMarks
        FROM students
        WHERE id = ?
    """, (student_id,)).fetchone()

    conn.close()

    return jsonify({
        "success": True,
        "message": "Student updated successfully",
        "student": dict(updated_student)
    })


# =========================================
# Delete Student
# =========================================

@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = get_db_connection()

    existing_student = conn.execute(
        "SELECT id FROM students WHERE id = ?",
        (student_id,)
    ).fetchone()

    if not existing_student:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    conn.execute(
        "DELETE FROM students WHERE id = ?",
        (student_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Student deleted successfully"
    })


# =========================================
# Start Application
# =========================================

init_db()
seed_students()

if __name__ == "__main__":
    app.run(debug=True)