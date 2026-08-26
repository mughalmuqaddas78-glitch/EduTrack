let students = [];


// ================================
// Load Students
// ================================

async function loadStudents() {
    try {
        const response = await fetch("/api/students");

        if (!response.ok) {
            throw new Error("Failed to load students.");
        }

        students = await response.json();

        refreshUI();

    } catch (error) {
        console.error("Error loading students:", error);

        alert(
            `Unable to load students.\n\n${error.message}`
        );
    }
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
// Calculate Overall Performance
// ================================

function getOverallPerformance(student) {
    return (
        (student.averageMarks * 0.6) +
        (student.attendance * 0.4)
    );
}


// ================================
// Calculate Risk Reason
// ================================

function getRiskReason(student) {
    const lowAttendance = student.attendance < 60;
    const lowMarks = student.averageMarks < 50;

    const attendanceNeedsImprovement =
        student.attendance < 75;

    const marksNeedImprovement =
        student.averageMarks < 65;

    if (lowAttendance && lowMarks) {
        return "Low attendance & low marks";
    }

    if (lowAttendance) {
        return "Low attendance";
    }

    if (lowMarks) {
        return "Low marks";
    }

    if (
        attendanceNeedsImprovement &&
        marksNeedImprovement
    ) {
        return "Attendance & marks need improvement";
    }

    if (attendanceNeedsImprovement) {
        return "Attendance needs improvement";
    }

    if (marksNeedImprovement) {
        return "Marks need improvement";
    }

    return "Performing well";
}


// ================================
// Update Dashboard
// ================================

function updateDashboard() {
    const totalStudents = students.length;

    const totalCard = document.querySelector(
        ".stat-card:nth-child(1) p"
    );

    const attendanceCard = document.querySelector(
        ".stat-card:nth-child(2) p"
    );

    const riskCard = document.querySelector(
        ".stat-card:nth-child(3) p"
    );

    const marksCard = document.querySelector(
        ".stat-card:nth-child(4) p"
    );

    const riskPercentageCard = document.querySelector(
        ".stat-card:nth-child(5) p"
    );

    if (
        !totalCard ||
        !attendanceCard ||
        !riskCard ||
        !marksCard ||
        !riskPercentageCard
    ) {
        return;
    }

    if (totalStudents === 0) {
        totalCard.textContent = "0";
        attendanceCard.textContent = "0%";
        riskCard.textContent = "0";
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

    const searchInput =
        document.querySelector(
            "#studentSearch"
        );

    const riskFilter =
        document.querySelector(
            "#riskFilter"
        );

    if (!studentTableBody) {
        return;
    }

    studentTableBody.innerHTML = "";

    const searchTerm =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";

    const selectedRisk =
        riskFilter
            ? riskFilter.value
            : "All";

    const filteredStudents =
        students
            .map((student, index) => ({
                student,
                index
            }))
            .filter(({ student }) => {

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
                <td colspan="7">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }

    filteredStudents.forEach(
        ({ student, index }) => {

            const riskLevel =
                getRiskLevel(student);

            const overallPerformance =
                getOverallPerformance(student);

            const riskReason =
                getRiskReason(student);

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
                    ${overallPerformance.toFixed(1)}%
                </td>

                <td>
                    <span class="risk-badge ${riskLevel.toLowerCase()}">
                        ${riskLevel}
                    </span>
                </td>

                <td>
                    ${riskReason}
                </td>

                <td>

                    <button
                        class="view-btn"
                        onclick="viewStudent(${index})">
                        View
                    </button>

                    <button
                        class="edit-btn"
                        onclick="editStudent(${student.id})">
                        Edit
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteStudent(${student.id})">
                        Delete
                    </button>

                </td>
            `;

            studentTableBody.appendChild(row);
        }
    );
}


// ================================
// Performance Chart
// ================================

function renderPerformanceChart() {
    const chart =
        document.querySelector(
            "#performanceChart"
        );

    if (!chart) {
        return;
    }

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

        const overallPerformance =
            getOverallPerformance(student);

        const row =
            document.createElement("div");

        row.className =
            "performance-row";

        row.innerHTML = `
            <div class="performance-info">

                <span class="performance-name">
                    ${student.name}
                </span>

                <span class="performance-value">
                    Overall:
                    ${overallPerformance.toFixed(1)}%
                </span>

            </div>

            <div class="performance-details">

                <span>
                    Marks:
                    ${student.averageMarks}%
                </span>

                <span>
                    Attendance:
                    ${student.attendance}%
                </span>

            </div>

            <div class="performance-bar">

                <div
                    class="performance-fill"
                    style="width: ${overallPerformance}%;">
                </div>

            </div>
        `;

        chart.appendChild(row);
    });
}


// ================================
// Refresh UI
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

if (studentForm) {

    studentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .querySelector("#studentName")
                    .value
                    .trim();

            const attendance =
                Number(
                    document.querySelector(
                        "#attendance"
                    ).value
                );

            const averageMarks =
                Number(
                    document.querySelector(
                        "#averageMarks"
                    ).value
                );

            if (!name) {
                alert(
                    "Please enter the student's name."
                );

                return;
            }

            if (
                Number.isNaN(attendance) ||
                attendance < 0 ||
                attendance > 100
            ) {
                alert(
                    "Attendance must be between 0 and 100."
                );

                return;
            }

            if (
                Number.isNaN(averageMarks) ||
                averageMarks < 0 ||
                averageMarks > 100
            ) {
                alert(
                    "Average marks must be between 0 and 100."
                );

                return;
            }

            const newStudent = {
                name,
                attendance,
                averageMarks
            };

            try {

                const response =
                    await fetch(
                        "/api/students",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    newStudent
                                )
                        }
                    );

                const result =
                    await response.json();

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Failed to add student."
                    );
                }

                students.push(
                    result.student
                );

                studentForm.reset();

                refreshUI();

            } catch (error) {

                console.error(
                    "Error adding student:",
                    error
                );

                alert(
                    `Unable to add student.\n\n${error.message}`
                );
            }
        }
    );
}


// ================================
// Delete Student
// ================================

async function deleteStudent(studentId) {

    const student =
        students.find(
            student =>
                student.id === studentId
        );

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

    try {

        const response =
            await fetch(
                `/api/students/${studentId}`,
                {
                    method: "DELETE"
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Failed to delete student."
            );
        }

        students =
            students.filter(
                student =>
                    student.id !== studentId
            );

        refreshUI();

    } catch (error) {

        console.error(
            "Error deleting student:",
            error
        );

        alert(
            `Unable to delete student.\n\n${error.message}`
        );
    }
}


// ================================
// Edit Student
// ================================

async function editStudent(studentId) {

    const student =
        students.find(
            student =>
                student.id === studentId
        );

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

    const trimmedName =
        newName.trim();

    if (!trimmedName) {

        alert(
            "Student name cannot be empty."
        );

        return;
    }

    const attendanceInput =
        prompt(
            "Enter attendance percentage:",
            student.attendance
        );

    if (attendanceInput === null) {
        return;
    }

    const newAttendance =
        Number(attendanceInput);

    if (
        Number.isNaN(newAttendance) ||
        newAttendance < 0 ||
        newAttendance > 100
    ) {

        alert(
            "Attendance must be between 0 and 100."
        );

        return;
    }

    const marksInput =
        prompt(
            "Enter average marks percentage:",
            student.averageMarks
        );

    if (marksInput === null) {
        return;
    }

    const newMarks =
        Number(marksInput);

    if (
        Number.isNaN(newMarks) ||
        newMarks < 0 ||
        newMarks > 100
    ) {

        alert(
            "Average marks must be between 0 and 100."
        );

        return;
    }

    const updatedStudent = {
        name: trimmedName,
        attendance: newAttendance,
        averageMarks: newMarks
    };

    try {

        const response =
            await fetch(
                `/api/students/${studentId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            updatedStudent
                        )
                }
            );

        const result =
            await response.json();

        if (
            !response.ok ||
            !result.success
        ) {
            throw new Error(
                result.message ||
                "Failed to update student."
            );
        }

        students =
            students.map(
                student =>
                    student.id === studentId
                        ? result.student
                        : student
            );

        refreshUI();

    } catch (error) {

        console.error(
            "Error updating student:",
            error
        );

        alert(
            `Unable to update student.\n\n${error.message}`
        );
    }
}


// ================================
// View Student
// ================================

function viewStudent(index) {

    const student =
        students[index];

    if (!student) {
        return;
    }

    const riskLevel =
        getRiskLevel(student);

    const riskReason =
        getRiskReason(student);

    const overallPerformance =
        getOverallPerformance(student);

    const details =
        document.querySelector(
            "#studentDetails"
        );

    if (!details) {
        return;
    }

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
            <strong>Overall Performance:</strong>
            ${overallPerformance.toFixed(1)}%
        </div>

        <div class="detail-item">
            <strong>Risk Level:</strong>
            ${riskLevel}
        </div>

        <div class="detail-item">
            <strong>Risk Reason:</strong>
            ${riskReason}
        </div>

        <div class="risk-message">
            ${message}
        </div>
    `;

    details.classList.add("active");
}


// ================================
// Search Students
// ================================

const studentSearch =
    document.querySelector(
        "#studentSearch"
    );

if (studentSearch) {

    studentSearch.addEventListener(
        "input",
        renderStudents
    );
}


// ================================
// Filter Students
// ================================

const riskFilter =
    document.querySelector(
        "#riskFilter"
    );

if (riskFilter) {

    riskFilter.addEventListener(
        "change",
        renderStudents
    );
}


// ================================
// Initial Load
// ================================

loadStudents();
