// models/Bid.js
import mongoose from "mongoose";

const bidSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  coverLetter: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
}, { timestamps: true });

export default mongoose.model("Bid", bidSchema);
