import express from "express";
import Bid from "../models/Bid.js";
import { authMiddleware, clientMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Approve a bid (client only)
router.patch("/:id/approve", authMiddleware, clientMiddleware, async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ error: "Bid not found" });
  bid.status = "approved"; // matches your schema
  await bid.save();
  res.json({ success: true, bid });
});

// Pay for approved bid (client only)
router.patch("/:id/pay", authMiddleware, clientMiddleware, async (req, res) => {
  const bid = await Bid.findById(req.params.id);
  if (!bid) return res.status(404).json({ error: "Bid not found" });
  if (bid.status !== "approved") return res.status(400).json({ error: "Bid not approved yet" });
  bid.paymentStatus = "paid";
  await bid.save();
  res.json({ success: true, bid });
});

// Get all bids for a job (any authorized user)
router.get("/job/:jobId", authMiddleware, async (req, res) => {
  const bids = await Bid.find({ jobId: req.params.jobId })
    .populate("freelancerId", "firstName lastName email");
  res.json({ bids });
});

// Get all bids by the logged-in freelancer (for My Bids page)
router.get("/my", authMiddleware, async (req, res) => {
  const freelancerId = req.userId; // From your middleware
  const bids = await Bid.find({ freelancerId })
    .populate("jobId", "title description budget deadline");
  res.json({ bids });
});

// Place a new bid (freelancer only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { jobId, amount, coverLetter } = req.body;
    const freelancerId = req.userId; // From your middleware
    console.log("Bid creation", { jobId, freelancerId, amount, coverLetter });
    const newBid = new Bid({ jobId, freelancerId, amount, coverLetter });
    await newBid.save();
    res.status(201).json({ success: true, bid: newBid });
  } catch (err) {
    console.error("Bid creation error:", err);
    res.status(500).json({ error: "Failed to create bid", details: err.message });
  }
});

export default router;
