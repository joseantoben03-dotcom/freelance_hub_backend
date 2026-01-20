import mongoose from "mongoose"

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  budget: {
    min: { type: Number, required: true },
    max: { type: Number, required: true }
  },
  duration: { type: String, required: true },
  skillsRequired: { type: [String], required: true },
  deadline: { type: Date }, // Make deadline optional
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bid" }],
  status: { type: String, default: "open" }
}, { timestamps: true });

export default mongoose.model("Job", JobSchema)
