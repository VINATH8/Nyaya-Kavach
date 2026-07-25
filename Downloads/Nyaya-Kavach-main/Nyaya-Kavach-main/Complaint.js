const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  complaintType: String,
  priority: String,
  incidentDate: Date,
  location: String,
  description: String,
  fullName: String,
  phone: String,
  email: String,
  address: String,
  witnesses: String,
  anonymous: Boolean,
  smsUpdates: Boolean,
  emailUpdates: Boolean,
  evidenceFiles: [String],
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Complaint", complaintSchema);
