import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// In-memory storage (demo only)
const complaints = [];

// Home route
app.get("/", (req, res) => {
  res.send("Nyaya Kavach Backend Running");
});

// Submit Complaint
app.post("/api/complaints", (req, res) => {
  const complaint = req.body;

  complaint.caseId = "CASE" + Date.now();
  complaint.status = "Pending";
  complaint.timeline = [
    {
      status: "Pending",
      date: new Date(),
      note: "Complaint filed"
    }
  ];

  complaints.push(complaint);

  res.status(201).json({
    message: "Complaint submitted successfully",
    caseId: complaint.caseId
  });
});

// Track Complaint
app.get("/api/complaints/track", (req, res) => {
  const caseId = req.query["case-id"];
  const aadhar = req.query.aadhar;
  const phone = req.query.phone;

  const complaint = complaints.find(c =>
    (caseId && c.caseId === caseId) ||
    (aadhar && c.aadharNumber === aadhar) ||
    (phone && c.phone === phone)
  );

  if (!complaint) {
    return res.status(404).json({
      error: "Complaint not found"
    });
  }

  res.json(complaint);
});

// Update Status
app.patch("/api/complaints/:caseId/status", (req, res) => {
  const { caseId } = req.params;
  const { status, note } = req.body;

  const complaint = complaints.find(c => c.caseId === caseId);

  if (!complaint) {
    return res.status(404).json({
      error: "Complaint not found"
    });
  }

  complaint.status = status;

  complaint.timeline.push({
    status,
    date: new Date(),
    note: note || ""
  });

  res.json({
    message: "Status updated successfully"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});