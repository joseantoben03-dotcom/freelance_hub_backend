import express from "express"
import Dispute from "../models/Dispute.js"
import { authMiddleware, adminMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all disputes (admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const disputes = await Dispute.find().populate("clientId freelancerId", "firstName lastName email")
    res.json(disputes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create dispute
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { jobId, otherUserId, reason, description } = req.body

    const dispute = new Dispute({
      jobId,
      clientId: req.userRole === "client" ? req.userId : otherUserId,
      freelancerId: req.userRole === "freelancer" ? req.userId : otherUserId,
      reason,
      description,
    })

    await dispute.save()
    res.status(201).json(dispute)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Resolve dispute (admin only)
router.patch("/:disputeId/resolve", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { resolution } = req.body

    const dispute = await Dispute.findById(req.params.disputeId)
    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" })
    }

    dispute.status = "resolved"
    dispute.resolution = resolution
    dispute.resolvedBy = req.userId
    await dispute.save()

    res.json(dispute)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
