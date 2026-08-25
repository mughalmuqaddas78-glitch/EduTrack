from flask import Flask, render_template, jsonify, request

app = Flask(__name__)


students = [
    {
        "name": "Ali",
        "attendance": 92,
        "averageMarks": 82
    },
    {
        "name": "Sara",
        "attendance": 78,
        "averageMarks": 65
    },
    {
        "name": "Ahmed",
        "attendance": 54,
        "averageMarks": 42
    }
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/students")
def get_students():
    return jsonify(students)


@app.route("/api/students", methods=["POST"])
def add_student():
    data = request.get_json()

    new_student = {
        "name": data["name"],
        "attendance": data["attendance"],
        "averageMarks": data["averageMarks"]
    }

    students.append(new_student)

    return jsonify(new_student), 201


if __name__ == "__main__":
    app.run(debug=True)