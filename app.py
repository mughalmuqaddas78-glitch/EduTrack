from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

DATABASE = "students.db"


# ========================================
# Database
# ========================================

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def validate_student_data(data):
    if not data:
        return None, "No data received"

    required_fields = [
        "name",
        "attendance",
        "averageMarks"
    ]

    for field in required_fields:
        if field not in data:
            return None, f"{field} is required"

    name = str(data["name"]).strip()

    if not name:
        return None, "Student name cannot be empty"

    try:
        attendance = int(data["attendance"])
        average_marks = int(data["averageMarks"])
    except (ValueError, TypeError):
        return None, "Attendance and averageMarks must be numbers"

    if not 0 <= attendance <= 100:
        return None, "Attendance must be between 0 and 100"

    if not 0 <= average_marks <= 100:
        return None, "Average marks must be between 0 and 100"

    return {
        "name": name,
        "attendance": attendance,
        "averageMarks": average_marks
    }, None


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

    conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    """)

    conn.commit()
    conn.close()

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


def get_student_by_id(conn, student_id):
    return conn.execute("""
        SELECT id, name, attendance, averageMarks
        FROM students
        WHERE id = ?
    """, (student_id,)).fetchone()


# ========================================
# Home
# ========================================

@app.route("/")
def home():
    return render_template("index.html")


# ========================================
# Get All Students
# ========================================

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


# ========================================
# Add Student
# ========================================

@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json()

    student_data, error = validate_student_data(data)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    conn = get_db_connection()

    cursor = conn.execute("""
        INSERT INTO students (name, attendance, averageMarks)
        VALUES (?, ?, ?)
    """, (
        student_data["name"],
        student_data["attendance"],
        student_data["averageMarks"]
    ))

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
@app.route("/api/attendance", methods=["POST"])
def add_attendance():
    data = request.get_json()

    student_id = data.get("student_id")
    date = data.get("date")
    status = data.get("status")

    if not student_id or not date or not status:
        return jsonify({
            "success": False,
            "message": "student_id, date and status are required."
        }), 400

    conn = get_db_connection()

    conn.execute("""
        INSERT INTO attendance (student_id, date, status)
        VALUES (?, ?, ?)
    """, (student_id, date, status))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Attendance added successfully."
    }), 201
# ========================================
# Get Student Attendance
# ========================================

@app.route("/api/attendance/<int:student_id>", methods=["GET"])
def get_attendance(student_id):

    conn = get_db_connection()

    # Check if student exists
    student = conn.execute("""
        SELECT id, name
        FROM students
        WHERE id = ?
    """, (student_id,)).fetchone()

    if not student:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404


    # Get attendance records
    attendance_records = conn.execute("""
        SELECT id, student_id, date, status
        FROM attendance
        WHERE student_id = ?
        ORDER BY date DESC
    """, (student_id,)).fetchall()

    conn.close()


    return jsonify({
        "success": True,
        "student": dict(student),
        "attendance": [
            dict(record)
            for record in attendance_records
        ]
    })
# ========================================
# Update Student
# ========================================

@app.route("/api/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    data = request.get_json()

    student, error = validate_student_data(data)

    if error:
        return jsonify({
            "success": False,
            "message": error
        }), 400

    conn = get_db_connection()

    existing_student = get_student_by_id(
        conn,
        student_id
    )

    if not existing_student:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Student not found"
        }), 404

    conn.execute("""
        UPDATE students
        SET
            name = ?,
            attendance = ?,
            averageMarks = ?
        WHERE id = ?
    """, (
        student["name"],
        student["attendance"],
        student["averageMarks"],
        student_id
    ))

    conn.commit()

    updated_student = get_student_by_id(
        conn,
        student_id
    )

    conn.close()

    return jsonify({
        "success": True,
        "message": "Student updated successfully",
        "student": dict(updated_student)
    })


# ========================================
# Delete Student
# ========================================

@app.route("/api/students/<int:student_id>", methods=["DELETE"])
def delete_student(student_id):
    conn = get_db_connection()

    existing_student = get_student_by_id(
        conn,
        student_id
    )

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


# ========================================
# Start Application
# ========================================

init_db()
seed_students()


if __name__ == "__main__":
    app.run(debug=True)