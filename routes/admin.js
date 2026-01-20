import express from "express"
import User from "../models/User.js"
import Dispute from "../models/Dispute.js"
import { authMiddleware, adminMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get pending freelancer approvals
router.get("/approvals", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.find({ role: "freelancer", isApproved: false })
    res.json(pendingUsers)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Approve freelancer
router.patch("/approve/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isApproved: true }, { new: true })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Reject freelancer
router.patch("/reject/:userId", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isApproved: false }, { new: true })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get dashboard stats
router.get("/stats", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const pendingApprovals = await User.countDocuments({ role: "freelancer", isApproved: false })
    const openDisputes = await Dispute.countDocuments({ status: "open" })

    res.json({ totalUsers, pendingApprovals, openDisputes })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
