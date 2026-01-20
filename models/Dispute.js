import mongoose from "mongoose"

const disputeSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: String,
    status: { type: String, enum: ["open", "in-review", "resolved", "closed"], default: "open" },
    resolution: String,
    resolvedBy: mongoose.Schema.Types.ObjectId,
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export default mongoose.model("Dispute", disputeSchema)
