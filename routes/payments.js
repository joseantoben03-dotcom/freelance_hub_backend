import express from "express"
import Payment from "../models/Payment.js"
import Job from "../models/Job.js"
import User from "../models/User.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.get("/", authMiddleware, async (req, res) => {
  try {
    const payments = await Payment.find({
      $or: [{ clientId: req.userId }, { freelancerId: req.userId }],
    }).populate("jobId", "title")

    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { jobId, amount } = req.body

    const job = await Job.findById(jobId).populate("selectedBidId")
    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: "Only job client can create payment" })
    }

    if (!job.selectedBidId) {
      return res.status(400).json({ error: "No bid selected for this job" })
    }

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ jobId, status: "held" })
    if (existingPayment) {
      return res.status(400).json({ error: "Payment already held for this job" })
    }

    const payment = new Payment({
      jobId,
      clientId: req.userId,
      freelancerId: job.selectedBidId.freelancerId,
      amount,
      status: "held",
    })

    await payment.save()

    // Update job status
    job.status = "in-progress"
    await job.save()

    res.status(201).json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.patch("/:paymentId/release", authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }

    if (payment.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: "Only client can release payment" })
    }

    if (payment.status !== "held") {
      return res.status(400).json({ error: "Payment is not in held status" })
    }

    payment.status = "released"
    await payment.save()

    // Update freelancer wallet and earnings
    const freelancer = await User.findById(payment.freelancerId)
    freelancer.walletBalance += payment.amount
    freelancer.totalEarnings += payment.amount
    freelancer.completedJobs = (freelancer.completedJobs || 0) + 1
    await freelancer.save()

    // Update job status
    const job = await Job.findById(payment.jobId)
    job.status = "completed"
    await job.save()

    res.json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.patch("/:paymentId/refund", authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }

    if (payment.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: "Only client can refund payment" })
    }

    if (payment.status !== "held") {
      return res.status(400).json({ error: "Only held payments can be refunded" })
    }

    payment.status = "refunded"
    await payment.save()

    res.json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get("/:paymentId", authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate("jobId")
      .populate("clientId", "firstName lastName email")
      .populate("freelancerId", "firstName lastName email")

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }

    // Check authorization
    if (payment.clientId._id.toString() !== req.userId && payment.freelancerId._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    res.json(payment)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
