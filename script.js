const students = [
    {
        name: "Ali",
        attendance: 92,
        averageMarks: 82
    },
    {
        name: "Sara",
        attendance: 78,
        averageMarks: 65
    },
    {
        name: "Ahmed",
        attendance: 54,
        averageMarks: 42
    }
];


function getRiskLevel(student) {

    if (student.attendance < 60 || student.averageMarks < 50) {
        return "High";
    }

    if (student.attendance < 75 || student.averageMarks < 65) {
        return "Medium";
    }

    return "Low";
}


function updateDashboard() {

    const totalStudents = students.length;

    const averageAttendance =
        students.reduce(
            (sum, student) => sum + student.attendance,
            0
        ) / totalStudents;

    const atRiskStudents = students.filter(
        student => getRiskLevel(student) === "High"
    ).length;

    document.querySelector(".stat-card:nth-child(1) p").textContent =
        totalStudents;

    document.querySelector(".stat-card:nth-child(2) p").textContent =
        `${averageAttendance.toFixed(1)}%`;

    document.querySelector(".stat-card:nth-child(3) p").textContent =
        atRiskStudents;
}


function renderStudents() {

    const studentTableBody =
        document.querySelector("#studentTableBody");

    studentTableBody.innerHTML = "";

    students.forEach((student, index) => {

        const riskLevel = getRiskLevel(student);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.name}</td>

            <td>${student.attendance}%</td>

            <td>${student.averageMarks}%</td>

            <td>
                <span class="risk-badge ${riskLevel.toLowerCase()}">
                    ${riskLevel}
                </span>
            </td>

            <td>
                <button
                    class="edit-btn"
                    onclick="editStudent(${index})">
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteStudent(${index})">
                    Delete
                </button>
            </td>
        `;

        studentTableBody.appendChild(row);
    });
}

const studentForm =
    document.querySelector("#studentForm");


studentForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const name =
        document.querySelector("#studentName").value.trim();

    const attendance =
        Number(document.querySelector("#attendance").value);

    const averageMarks =
        Number(document.querySelector("#averageMarks").value);


    // Validation

    if (!name) {
        alert("Please enter the student's name.");
        return;
    }

    if (attendance < 0 || attendance > 100) {
        alert("Attendance must be between 0 and 100.");
        return;
    }

    if (averageMarks < 0 || averageMarks > 100) {
        alert("Average marks must be between 0 and 100.");
        return;
    }


    const newStudent = {
        name: name,
        attendance: attendance,
        averageMarks: averageMarks
    };


    students.push(newStudent);

    studentForm.reset();

    updateDashboard();
    renderStudents();
});


updateDashboard();
renderStudents();
function deleteStudent(index) {

    const studentName = students[index].name;

    const confirmDelete =
        confirm(`Are you sure you want to delete ${studentName}?`);

    if (!confirmDelete) {
        return;
    }

    students.splice(index, 1);

    updateDashboard();
    renderStudents();
}


function editStudent(index) {

    const student = students[index];

    const newName =
        prompt("Enter student name:", student.name);

    if (newName === null) {
        return;
    }

    const newAttendance =
        Number(
            prompt(
                "Enter attendance percentage:",
                student.attendance
            )
        );

    const newMarks =
        Number(
            prompt(
                "Enter average marks percentage:",
                student.averageMarks
            )
        );


    if (!newName.trim()) {
        alert("Student name cannot be empty.");
        return;
    }

    if (
        newAttendance < 0 ||
        newAttendance > 100 ||
        newMarks < 0 ||
        newMarks > 100
    ) {
        alert("Attendance and marks must be between 0 and 100.");
        return;
    }


    students[index].name = newName.trim();
    students[index].attendance = newAttendance;
    students[index].averageMarks = newMarks;


    updateDashboard();
    renderStudents();
}