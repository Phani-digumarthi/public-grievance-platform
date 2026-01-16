// server/models/Grievance.js
const mongoose = require('mongoose');

const GrievanceSchema = new mongoose.Schema(
  {
    citizenName: { type: String, required: true },
    area: { type: String, required: true },
    description: { type: String, required: true },
    
    imageUrl: { type: String, default: "" }, 
    audioUrl: { type: String, default: "" },
    
    category: { type: String, required: true },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Low" },
    estimatedTime: { type: String, default: "1 Week" },
    
    sentiment: { type: String, default: "Neutral" },
    status: { type: String, enum: ["Pending", "In Progress", "Resolved", "Rejected"], default: "Pending" },
    
    // === NEW FIELD ===
    adminReply: { type: String, default: "" } 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grievance", GrievanceSchema);