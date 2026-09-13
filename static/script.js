let students = [];

// ========================================
// Attendance Form
// ========================================

const attendanceForm =
    document.querySelector(
        "#attendanceForm"
    );


if (attendanceForm) {

    attendanceForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const studentId =
                document.querySelector(
                    "#attendanceStudent"
                ).value;


            const date =
                document.querySelector(
                    "#attendanceDate"
                ).value;


            const status =
                document.querySelector(
                    "#attendanceStatus"
                ).value;


            // Validation

            if (!studentId) {

    showToast(
        "Please select a student.",
        "error"
    );

    return;
}


if (!date) {

    showToast(
        "Please select a date.",
        "error"
    );

    return;
}


if (!status) {

    showToast(
        "Please select attendance status.",
        "error"
    );

    return;
}
            // Save attendance

           const saved =
    await addAttendance(
        Number(studentId),
        date,
        status
    );


if (saved) {

    attendanceForm.reset();

    // Refresh students, attendance %, dashboard & risk
    await loadStudents();
}

            // Reset form

            attendanceForm.reset();

        }
    );
}
// ========================================
// Load Students
// ========================================

async function loadStudents() {

    try {

        const response =
            await fetch("/api/students");


        if (!response.ok) {

            throw new Error(
                "Failed to load students."
            );
        }


        students =
            await response.json();


        // ========================================
        // Load Actual Attendance Percentage
        // ========================================

        await Promise.all(

            students.map(
                async function (student) {

                    try {

                        const attendanceResponse =
                            await fetch(
                                `/api/attendance/${student.id}/percentage`
                            );


                        if (
                            !attendanceResponse.ok
                        ) {

                            throw new Error(
                                "Failed to load attendance."
                            );
                        }


                        const attendanceResult =
                            await attendanceResponse.json();


                        if (
                            attendanceResult.success
                        ) {

                            student.attendance =
                                attendanceResult.attendance_percentage;
                        }

                    } catch (error) {

                        console.error(
                            `Error loading attendance for ${student.name}:`,
                            error
                        );

                    }

                }
            )

        );


        // ========================================
        // Refresh UI
        // ========================================

        populateAttendanceStudents();

        populateAttendanceHistoryStudents();

        refreshUI();


    } catch (error) {

        console.error(
            "Error loading students:",
            error
        );


        alert(
            `Unable to load students.\n\n${error.message}`
        );
    }
}
// ========================================
// Populate Attendance Students
// ========================================

function populateAttendanceStudents() {

    const attendanceStudent =
        document.querySelector(
            "#attendanceStudent"
        );

    if (!attendanceStudent) {
        return;
    }

    attendanceStudent.innerHTML = `
        <option value="">
            Select Student
        </option>
    `;

    students.forEach(student => {

        const option =
            document.createElement("option");

        option.value = student.id;

        option.textContent =
            student.name;

        attendanceStudent.appendChild(option);
    });
}
// ========================================
// Populate Attendance History Students
// ========================================

function populateAttendanceHistoryStudents() {

    const historyStudent =
        document.querySelector("#historyStudent");

    if (!historyStudent) {
        return;
    }

    historyStudent.innerHTML = `
        <option value="">
            Select Student
        </option>
    `;

    students.forEach(student => {

        const option =
            document.createElement("option");

        option.value = student.id;

        option.textContent = student.name;

        historyStudent.appendChild(option);
    });
}
// ========================================
// Load Attendance History
// ========================================

async function loadAttendanceHistory(studentId) {

    const historyBody =
        document.querySelector("#attendanceHistoryBody");

    if (!historyBody) {
        return;
    }

    if (!studentId) {

        historyBody.innerHTML = `
            <tr>
                <td colspan="2">
                    Select a student to view attendance.
                </td>
            </tr>
        `;

        return;
    }

    try {

        const response =
            await fetch(
                `/api/attendance/${studentId}`
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Failed to load attendance."
            );
        }

        if (result.attendance.length === 0) {

            historyBody.innerHTML = `
                <tr>
                    <td colspan="2">
                        No attendance records found.
                    </td>
                </tr>
            `;

            return;
        }

        historyBody.innerHTML =
            result.attendance.map(record => {

                const statusClass =
                    record.status === "Present"
                        ? "attendance-status-present"
                        : "attendance-status-absent";

                return `
                    <tr>

                        <td>
                            ${record.date}
                        </td>

                        <td>
                            <span class="${statusClass}">
                                ${record.status}
                            </span>
                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(
            "Error loading attendance:",
            error
        );

        historyBody.innerHTML = `
            <tr>
                <td colspan="2">
                    Unable to load attendance records.
                </td>
            </tr>
        `;
    }
}// ========================================
// Attendance History Student Selection
// ========================================

const historyStudent =
    document.querySelector("#historyStudent");


if (historyStudent) {

    historyStudent.addEventListener(
        "change",
        function () {

            const studentId =
                this.value;

            loadAttendanceHistory(
                studentId
            );
        }
    );
}
// ========================================
// Calculate Risk Level
// ========================================

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


// ========================================
// Calculate Overall Performance
// ========================================

function getOverallPerformance(student) {

    return (
        (student.averageMarks * 0.6) +
        (student.attendance * 0.4)
    );
}


// ========================================
// Calculate Risk Reason
// ========================================

function getRiskReason(student) {

    const lowAttendance =
        student.attendance < 60;

    const lowMarks =
        student.averageMarks < 50;

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


// ========================================
// Calculate Recommendation
// ========================================

function getRecommendation(student) {

    const lowAttendance =
        student.attendance < 60;

    const lowMarks =
        student.averageMarks < 50;


    if (lowAttendance && lowMarks) {
        return "Student needs both attendance improvement and academic support.";
    }

    if (lowAttendance) {
        return "Student should improve attendance and maintain regular class participation.";
    }

    if (lowMarks) {
        return "Student needs academic support, revision, and additional practice.";
    }

    if (
        student.attendance < 75 &&
        student.averageMarks < 65
    ) {
        return "Monitor the student regularly and provide additional support.";
    }

    if (student.attendance < 75) {
        return "Encourage more regular class attendance.";
    }

    if (student.averageMarks < 65) {
        return "Encourage additional practice and academic revision.";
    }

    return "Student is performing well. Continue regular monitoring.";
}


// ========================================
// Update Dashboard
// ========================================

function updateDashboard() {

    const totalStudents =
        students.length;


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


// ========================================
// Update Risk Analysis
// ========================================

function updateRiskAnalysis() {

    const highRiskCount =
        students.filter(
            student =>
                getRiskLevel(student) === "High"
        ).length;


    const mediumRiskCount =
        students.filter(
            student =>
                getRiskLevel(student) === "Medium"
        ).length;


    const lowRiskCount =
        students.filter(
            student =>
                getRiskLevel(student) === "Low"
        ).length;


    const highRiskElement =
        document.querySelector("#highRiskCount");

    const mediumRiskElement =
        document.querySelector("#mediumRiskCount");

    const lowRiskElement =
        document.querySelector("#lowRiskCount");


    if (highRiskElement) {
        highRiskElement.textContent =
            highRiskCount;
    }

    if (mediumRiskElement) {
        mediumRiskElement.textContent =
            mediumRiskCount;
    }

    if (lowRiskElement) {
        lowRiskElement.textContent =
            lowRiskCount;
    }
}


// ========================================
// Render Students
// ========================================

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
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const selectedRisk =
        riskFilter
            ? riskFilter.value
            : "All";


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
                <td colspan="7">
                    No students found.
                </td>
            </tr>
        `;

        return;
    }


    filteredStudents.forEach(student => {

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
                    onclick="viewStudent(${student.id})"
                >
                    View
                </button>

                <button
                    class="edit-btn"
                    onclick="editStudent(${student.id})"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteStudent(${student.id})"
                >
                    Delete
                </button>

            </td>
        `;


        studentTableBody.appendChild(row);
    });
}


// ========================================
// Performance Chart
// ========================================

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


// ========================================
// Refresh UI
// ========================================

function refreshUI() {

    updateDashboard();

    updateRiskAnalysis();

    renderStudents();

    renderPerformanceChart();
}


// ========================================
// Add Student
// ========================================

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
                    .querySelector(
                        "#studentName"
                    )
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


// ========================================
// Delete Student
// ========================================

// ========================================
// Delete Student
// ========================================

let deletingStudentId = null;


// Open Delete Modal
function deleteStudent(studentId) {

    const student =
        students.find(
            student =>
                student.id === studentId
        );


    if (!student) {
        return;
    }


    deletingStudentId =
        studentId;


    const deleteMessage =
        document.querySelector(
            "#deleteMessage"
        );


    const deleteModal =
        document.querySelector(
            "#deleteModal"
        );


    if (deleteMessage) {

        deleteMessage.textContent =
            `Are you sure you want to delete ${student.name}?`;
    }


    if (deleteModal) {

        deleteModal.classList.add(
            "active"
        );
    }
}


// ========================================
// Confirm Delete
// ========================================

const confirmDeleteButton =
    document.querySelector(
        "#confirmDelete"
    );


if (confirmDeleteButton) {

    confirmDeleteButton.addEventListener(
        "click",
        async function () {

            if (deletingStudentId === null) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `/api/students/${deletingStudentId}`,
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


                // Remove student from local array
                students =
                    students.filter(
                        student =>
                            student.id !== deletingStudentId
                    );


                // Close modal
                closeDeleteModal();


                // Refresh dashboard and table
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
    );
}


// ========================================
// Close Delete Modal
// ========================================

function closeDeleteModal() {

    const deleteModal =
        document.querySelector(
            "#deleteModal"
        );


    if (deleteModal) {

        deleteModal.classList.remove(
            "active"
        );
    }


    deletingStudentId = null;
}


// ========================================
// Delete Modal Close Button
// ========================================

const closeDeleteButton =
    document.querySelector(
        "#closeDeleteModal"
    );


if (closeDeleteButton) {

    closeDeleteButton.addEventListener(
        "click",
        closeDeleteModal
    );
}


// ========================================
// Delete Modal Cancel Button
// ========================================

const cancelDeleteButton =
    document.querySelector(
        "#cancelDelete"
    );


if (cancelDeleteButton) {

    cancelDeleteButton.addEventListener(
        "click",
        closeDeleteModal
    );
}

// ========================================
// Edit Student
// ========================================

let editingStudentId = null;


function editStudent(studentId) {

    const student =
        students.find(
            student =>
                student.id === studentId
        );


    if (!student) {
        return;
    }


    editingStudentId =
        studentId;


    document.querySelector(
        "#editStudentName"
    ).value =
        student.name;


    document.querySelector(
        "#editAttendance"
    ).value =
        student.attendance;


    document.querySelector(
        "#editAverageMarks"
    ).value =
        student.averageMarks;


    document.querySelector(
        "#editModal"
    ).classList.add("active");
}


const editStudentForm =
    document.querySelector(
        "#editStudentForm"
    );


if (editStudentForm) {

    editStudentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const name =
                document
                    .querySelector(
                        "#editStudentName"
                    )
                    .value
                    .trim();


            const attendance =
                Number(
                    document.querySelector(
                        "#editAttendance"
                    ).value
                );


            const averageMarks =
                Number(
                    document.querySelector(
                        "#editAverageMarks"
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


            try {

                const response =
                    await fetch(
                        `/api/students/${editingStudentId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                attendance: attendance,
                                averageMarks: averageMarks
                            })
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
                            student.id === editingStudentId
                                ? result.student
                                : student
                    );


                closeEditModal();


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
    );
}


// ========================================
// Close Edit Modal
// ========================================

function closeEditModal() {

    const editModal =
        document.querySelector(
            "#editModal"
        );


    const editStudentForm =
        document.querySelector(
            "#editStudentForm"
        );


    if (editModal) {

        editModal.classList.remove(
            "active"
        );
    }


    if (editStudentForm) {

        editStudentForm.reset();
    }


    editingStudentId = null;
}


// Close button

const closeEditButton =
    document.querySelector(
        "#closeEditModal"
    );


if (closeEditButton) {

    closeEditButton.addEventListener(
        "click",
        closeEditModal
    );
}


// Cancel button

const cancelEditButton =
    document.querySelector(
        "#cancelEdit"
    );


if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        closeEditModal
    );
}


// ========================================
// View Student
// ========================================

// ========================================
// View Student
// ========================================

async function viewStudent(studentId) {

    const student =
        students.find(
            student =>
                student.id === studentId
        );


    if (!student) {
        return;
    }


    // ========================================
    // Get Actual Attendance Percentage
    // ========================================

    let attendance =
        student.attendance;


    try {

        const response =
            await fetch(
                `/api/attendance/${studentId}/percentage`
            );


        const result =
            await response.json();


        if (response.ok && result.success) {

            attendance =
                result.attendance_percentage;
        }

    } catch (error) {

        console.error(
            "Error loading attendance percentage:",
            error
        );
    }


    // ========================================
    // Create Student Data for Display
    // ========================================

    const studentForDisplay = {
        ...student,
        attendance: attendance
    };


    // Overall performance
    const overall =
        getOverallPerformance(
            studentForDisplay
        );


    // Risk level
    const risk =
        getRiskLevel(
            studentForDisplay
        );


    // Student name
    document.querySelector(
        "#detailStudentName"
    ).textContent =
        student.name;


    // Attendance
    document.querySelector(
        "#detailAttendance"
    ).textContent =
        `${attendance}%`;


    // Average marks
    document.querySelector(
        "#detailMarks"
    ).textContent =
        `${student.averageMarks}%`;


    // Overall performance
    document.querySelector(
        "#detailOverall"
    ).textContent =
        `${overall.toFixed(1)}%`;


    // Risk level
    document.querySelector(
        "#detailRisk"
    ).textContent =
        risk;


    // Risk reason
    document.querySelector(
        "#detailRiskReason"
    ).textContent =
        getRiskReason(
            studentForDisplay
        );


    // Recommendation
    document.querySelector(
        "#detailRecommendation"
    ).textContent =
        getRecommendation(
            studentForDisplay
        );


    // Show student details
    document.querySelector(
        "#studentDetails"
    ).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// ========================================
// Search Students
// ========================================

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


// ========================================
// Filter Students
// ========================================

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
// ========================================
// Toast Notification
// ========================================

function showToast(message, type = "success") {

    const toast =
        document.createElement("div");

    toast.className =
        `toast-notification ${type}`;

    toast.textContent =
        message;

    document.body.appendChild(toast);


    setTimeout(() => {

        toast.classList.add("show");

    }, 10);


    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3000);
}
// ========================================
// Add Attendance
// ========================================

// ========================================
// Add Attendance
// ========================================

async function addAttendance(studentId, date, status) {

    try {

        const response =
            await fetch(
                "/api/attendance",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        student_id: studentId,
                        date: date,
                        status: status
                    })
                }
            );


        const result =
            await response.json();


        if (!response.ok || !result.success) {

            showToast(
                result.message ||
                "Failed to save attendance.",
                "error"
            );

            return false;
        }


        showToast(
            "Attendance saved successfully.",
            "success"
        );

        return true;


    } catch (error) {

        console.error(
            "Error adding attendance:",
            error
        );


        showToast(
            "Unable to save attendance. Please try again.",
            "error"
        );

        return false;
    }
}
// ========================================
// Initial Load
// ========================================

loadStudents();