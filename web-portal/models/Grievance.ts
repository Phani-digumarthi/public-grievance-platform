// web-portal/models/Grievance.ts
import mongoose, { Schema, model, models } from "mongoose";

const GrievanceSchema = new Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: String,
      required: true,
    },
    aiConfidence: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    citizenEmail: {
      type: String, // In a real app, this comes from the logged-in user
      default: "anonymous@citizen.com" 
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// This check is important for Next.js to prevent "Model already exists" errors
const Grievance = models.Grievance || model("Grievance", GrievanceSchema);

export default Grievance;