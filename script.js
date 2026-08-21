const defaultStudents = [
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

let students =
    JSON.parse(localStorage.getItem("students")) ||
    defaultStudents;


// ================================
// Save Students
// ================================

function saveStudents() {
    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );
}


// ================================
// Calculate Risk Level
// ================================

function getRiskLevel(student) {

    if (
        student.attendance < 60 ||
        student.averageMarks < 50
    ) {
        return "High";
    }

    if (
        student.attendance < 75 ||
        student.averageMarks < 65
    ) {
        return "Medium";
    }

    return "Low";
}


// ================================
// Update Dashboard
// ================================

function updateDashboard() {

    const totalStudents = students.length;

    const totalCard =
        document.querySelector(
            ".stat-card:nth-child(1) p"
        );

    const attendanceCard =
        document.querySelector(
            ".stat-card:nth-child(2) p"
        );

    const riskCard =
        document.querySelector(
            ".stat-card:nth-child(3) p"
        );

    const marksCard =
        document.querySelector(
            ".stat-card:nth-child(4) p"
        );

    const riskPercentageCard =
        document.querySelector(
            ".stat-card:nth-child(5) p"
        );


    if (totalStudents === 0) {

        totalCard.textContent = 0;
        attendanceCard.textContent = "0%";
        riskCard.textContent = 0;
        marksCard.textContent = "0%";
        riskPercentageCard.textContent = "0%";

        return;
    }


    const averageAttendance =
        students.reduce(
            (sum, student) =>
                sum + student.attendance,
            0
        ) / totalStudents;


    const averageMarks =
        students.reduce(
            (sum, student) =>
                sum + student.averageMarks,
            0
        ) / totalStudents;


    const atRiskStudents =
        students.filter(
            student =>
                getRiskLevel(student) === "High"
        ).length;


    const riskPercentage =
        (atRiskStudents / totalStudents) * 100;


    totalCard.textContent =
        totalStudents;


    attendanceCard.textContent =
        `${averageAttendance.toFixed(1)}%`;


    riskCard.textContent =
        atRiskStudents;


    marksCard.textContent =
        `${averageMarks.toFixed(1)}%`;


    riskPercentageCard.textContent =
        `${riskPercentage.toFixed(1)}%`;
}


// ================================
// Render Students
// ================================

function renderStudents() {

    const studentTableBody =
        document.querySelector(
            "#studentTableBody"
        );


    studentTableBody.innerHTML = "";


    const searchTerm =
        document
            .querySelector("#studentSearch")
            .value
            .toLowerCase()
            .trim();


    const selectedRisk =
        document.querySelector(
            "#riskFilter"
        ).value;


    const filteredStudents =
        students.filter(student => {

            const matchesSearch =
                student.name
                    .toLowerCase()
                    .includes(searchTerm);


            const matchesRisk =
                selectedRisk === "All" ||
                getRiskLevel(student) === selectedRisk;


            return (
                matchesSearch &&
                matchesRisk
            );
        });


    if (filteredStudents.length === 0) {

        studentTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }


    filteredStudents.forEach(student => {

        const riskLevel =
            getRiskLevel(student);


        const index =
            students.indexOf(student);


        const row =
            document.createElement("tr");


        row.innerHTML = `
            <td>
                ${student.name}
            </td>

            <td>
                ${student.attendance}%
            </td>

            <td>
                ${student.averageMarks}%
            </td>

            <td>
                <span
                    class="risk-badge ${riskLevel.toLowerCase()}">
                    ${riskLevel}
                </span>
            </td>

          <td>

    <button
        class="view-btn"
        onclick="viewStudent(${index})">
        View
    </button>

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


// ================================
// Performance Chart
// ================================

function renderPerformanceChart() {

    const chart =
        document.querySelector(
            "#performanceChart"
        );


    chart.innerHTML = "";


    if (students.length === 0) {

        chart.innerHTML = `
            <p>
                No student data available.
            </p>
        `;

        return;
    }


    students.forEach(student => {

        const row =
            document.createElement("div");


        row.className =
            "performance-row";


        row.innerHTML = `
            <span class="performance-name">
                ${student.name}
            </span>

            <div class="performance-bar">

                <div
                    class="performance-fill"
                    style="
                        width: ${student.averageMarks}%;
                    ">
                </div>

            </div>

            <span class="performance-value">
                ${student.averageMarks}%
            </span>
        `;


        chart.appendChild(row);
    });
}


// ================================
// Refresh Entire UI
// ================================

function refreshUI() {

    updateDashboard();

    renderStudents();

    renderPerformanceChart();
}


// ================================
// Add Student
// ================================

const studentForm =
    document.querySelector(
        "#studentForm"
    );


studentForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        const name =
            document
                .querySelector("#studentName")
                .value
                .trim();


        const attendance =
            Number(
                document
                    .querySelector("#attendance")
                    .value
            );


        const averageMarks =
            Number(
                document
                    .querySelector("#averageMarks")
                    .value
            );


        // Validation

        if (!name) {

            alert(
                "Please enter the student's name."
            );

            return;
        }


        if (
            attendance < 0 ||
            attendance > 100
        ) {

            alert(
                "Attendance must be between 0 and 100."
            );

            return;
        }


        if (
            averageMarks < 0 ||
            averageMarks > 100
        ) {

            alert(
                "Average marks must be between 0 and 100."
            );

            return;
        }


        const newStudent = {

            name: name,

            attendance: attendance,

            averageMarks: averageMarks
        };


        students.push(newStudent);


        saveStudents();


        studentForm.reset();


        refreshUI();
    }
);


// ================================
// Delete Student
// ================================

function deleteStudent(index) {

    const student =
        students[index];


    if (!student) {
        return;
    }


    const confirmDelete =
        confirm(
            `Are you sure you want to delete ${student.name}?`
        );


    if (!confirmDelete) {
        return;
    }


    students.splice(index, 1);


    saveStudents();


    refreshUI();
}


// ================================
// Edit Student
// ================================

function editStudent(index) {

    const student =
        students[index];


    if (!student) {
        return;
    }


    const newName =
        prompt(
            "Enter student name:",
            student.name
        );


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

        alert(
            "Student name cannot be empty."
        );

        return;
    }


    if (
        newAttendance < 0 ||
        newAttendance > 100 ||
        newMarks < 0 ||
        newMarks > 100 ||
        Number.isNaN(newAttendance) ||
        Number.isNaN(newMarks)
    ) {

        alert(
            "Attendance and marks must be between 0 and 100."
        );

        return;
    }


    students[index].name =
        newName.trim();


    students[index].attendance =
        newAttendance;


    students[index].averageMarks =
        newMarks;


    saveStudents();
    updateDashboard();
renderStudents();
renderPerformanceChart();

    refreshUI();
}


// ================================
// Search Students
// ================================

document
    .querySelector("#studentSearch")
    .addEventListener(
        "input",
        renderStudents
    );


// ================================
// Filter by Risk
// ================================

document
    .querySelector("#riskFilter")
    .addEventListener(
        "change",
        renderStudents
    );
function viewStudent(index) {

    const student = students[index];

    const riskLevel = getRiskLevel(student);

    const details =
        document.querySelector("#studentDetails");

    let message;

    if (riskLevel === "High") {
        message =
            "This student may need immediate academic support. Consider reviewing attendance and recent assessments.";
    } else if (riskLevel === "Medium") {
        message =
            "This student shows some warning signs. Regular monitoring and additional support may be helpful.";
    } else {
        message =
            "This student is currently performing within the expected range.";
    }

    details.innerHTML = `
        <h3>${student.name}</h3>

        <div class="detail-item">
            <strong>Attendance:</strong>
            ${student.attendance}%
        </div>

        <div class="detail-item">
            <strong>Average Marks:</strong>
            ${student.averageMarks}%
        </div>

        <div class="detail-item">
            <strong>Risk Level:</strong>
            ${riskLevel}
        </div>

        <div class="risk-message">
            ${message}
        </div>
    `;

    details.classList.add("active");
}

// ================================
// Initial Load
// ================================

refreshUI();