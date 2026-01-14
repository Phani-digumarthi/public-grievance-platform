// server/models/Grievance.js
const mongoose = require('mongoose');

const GrievanceSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    // NEW: Store the image path
    imageUrl: { type: String, default: "" }, 
    
    category: { type: String, required: true },
    aiConfidence: { type: Number, default: 0 },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Low" },
    sentiment: { type: String, default: "Neutral" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    citizenEmail: { type: String, default: "anonymous@citizen.com" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Grievance", GrievanceSchema);