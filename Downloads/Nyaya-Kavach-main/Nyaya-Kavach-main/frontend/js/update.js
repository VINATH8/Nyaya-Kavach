document.getElementById("updateForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const caseId = document.getElementById("caseId").value.trim();
    const status = document.getElementById("status").value;

    try {
        const response = await fetch(`http://localhost:5000/api/complaints/update-status/${caseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("updateResult").innerHTML = `
                <p style="color: lightgreen;">✅ ${data.message}</p>
                <p><b>Case ID:</b> ${data.complaint.caseId}</p>
                <p><b>Updated Status:</b> ${data.complaint.status}</p>
            `;
        } else {
            document.getElementById("updateResult").innerHTML = `<p style="color: red;">❌ ${data.message}</p>`;
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("updateResult").innerHTML = `<p style="color: red;">❌ Server error. Try again later.</p>`;
    }
});
