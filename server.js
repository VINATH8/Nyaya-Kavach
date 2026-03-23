// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

// 1️⃣ Load environment variables
dotenv.config();

// 2️⃣ Read variables
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.DB_NAME;
const port = process.env.PORT || 5000;

// 3️⃣ Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// 4️⃣ Connect to MongoDB
let db, complaintsCollection;
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
    .then(client => {
        db = client.db(dbName);
        complaintsCollection = db.collection("complaints");
        console.log(`Connected to database: ${dbName}`);
    })
    .catch(err => console.error("MongoDB connection error:", err));

// 5️⃣ Routes

// Root route
app.get("/", (req, res) => {
    res.send("Nyaya Kavach backend is running!");
});

// POST /api/complaints - File a new complaint
app.post("/api/complaints", async (req, res) => {
    try {
        const complaint = req.body;

        // Add system-generated fields
        complaint.caseId = `CASE${Date.now()}`;
        complaint.status = "Pending";
        complaint.timeline = [
            {
                status: "Pending",
                date: new Date(),
                note: "Complaint filed"
            }
        ];

        const result = await complaintsCollection.insertOne(complaint);
        res.status(201).json({
            message: "Complaint filed successfully",
            caseId: complaint.caseId
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to file complaint" });
    }
});

// GET /api/complaints/track - Track complaint
// Query params: case-id, aadhar, phone
app.get("/api/complaints/track", async (req, res) => {
    try {
        const { "case-id": caseId, aadhar, phone } = req.query;

        let query = {};
        if (caseId) query.caseId = caseId;
        else if (aadhar) query.aadharNumber = aadhar;
        else if (phone) query.phone = phone;
        else return res.status(400).json({ error: "Please provide case-id, aadhar, or phone" });

        const complaint = await complaintsCollection.findOne(query);
        if (!complaint) return res.status(404).json({ error: "Complaint not found" });

        res.json(complaint);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch complaint" });
    }
});

// PATCH /api/complaints/:caseId/status - Update status & timeline
app.patch("/api/complaints/:caseId/status", async (req, res) => {
    try {
        const { caseId } = req.params;
        const { status, note } = req.body;

        if (!status) return res.status(400).json({ error: "Status is required" });

        const update = {
            $set: { status },
            $push: { timeline: { status, date: new Date(), note: note || "" } }
        };

        const result = await complaintsCollection.updateOne({ caseId }, update);
        if (result.matchedCount === 0) return res.status(404).json({ error: "Complaint not found" });

        res.json({ message: "Complaint status updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update status" });
    }
});

// 6️⃣ Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
// Update complaint status by Case ID
app.put("/api/complaints/update-status/:caseId", async (req, res) => {
  try {
    const { caseId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const result = await db.collection("complaints").findOneAndUpdate(
      { caseId },
      { $set: { status } },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ message: "Status updated successfully", complaint: result.value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Track complaint by Case ID, Aadhaar, or Phone
app.get("/api/complaints/track", async (req, res) => {
  try {
    const { caseId, aadhar, phone } = req.query;

    if (!caseId && !aadhar && !phone) {
      return res.status(400).json({ error: "Provide caseId, aadhar, or phone to track" });
    }

    let query = {};
    if (caseId) query.caseId = caseId;
    if (aadhar) query.aadhar = aadhar;
    if (phone) query.phone = phone;

    const db = client.db(dbName);
    const complaints = await db.collection("complaints").find(query).toArray();

    if (complaints.length === 0) {
      return res.status(404).json({ message: "No complaints found" });
    }

    res.json(complaints);
  } catch (err) {
    console.error("Error tracking complaint:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Complaint Submission with Translation
app.post("/submit-complaint", async (req, res) => {
  const { complaintText, language } = req.body;

  const translation = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Translate to English only." },
      { role: "user", content: complaintText }
    ]
  });

  const translatedText = translation.choices[0].message.content;

  const complaint = new Complaint({
    originalText: complaintText,
    translatedText,
    language
  });

  await complaint.save();
  res.json({ success: true, complaint });
});

// Chatbot Routing + AI
app.post("/chatbot", async (req, res) => {
  const msg = req.body.message.toLowerCase();

  if (msg.includes("complain")) {
    return res.json({ reply: "Taking you to the complaint section...", redirect: "/complaint" });
  } 
  if (msg.includes("track") || msg.includes("status")) {
    return res.json({ reply: "Taking you to case tracking...", redirect: "/track" });
  } 

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: msg }]
  });

  res.json({ reply: response.choices[0].message.content });
});


