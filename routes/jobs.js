import express from "express"
import Job from "../models/Job.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get all jobs with optional filters
router.get("/", async (req, res) => {
  try {
    const query = {}
    // Category filter
    if (req.query.category) query.category = req.query.category
    // Status filter
    if (req.query.status) query.status = req.query.status
    // Search filter (title or description)
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ]
    }

    const jobs = await Job.find(query)
      .populate("clientId", "firstName lastName")
      .populate("bids")

    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current client's jobs for dashboard
router.get("/my-jobs", authMiddleware, async (req, res) => {
  try {
    const jobs = await Job.find({ clientId: req.userId })
      .populate("clientId", "firstName lastName")
      .populate("bids")

    // If you want to compute totalSpent, do it here.
    // For now just send 0 so frontend works.
    res.json({
      jobs,
      totalSpent: 0,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get job by ID
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("clientId")
      .populate("bids")

    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    res.json(job)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create job (clients only)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      budget,
      duration,
      skillsRequired,
      deadline,
    } = req.body

    // Validate required fields
    if (
      !title ||
      !description ||
      !category ||
      !budget ||
      !duration ||
      !skillsRequired
    ) {
      return res.status(400).json({ message: "Missing required fields" })
    }

    if (
      typeof budget.min !== "number" ||
      typeof budget.max !== "number" ||
      budget.min > budget.max
    ) {
      return res.status(400).json({ message: "Invalid budget range" })
    }

    if (!Array.isArray(skillsRequired) || skillsRequired.length === 0) {
      return res
        .status(400)
        .json({ message: "Please add at least one required skill" })
    }

    const job = new Job({
      title,
      description,
      category,
      budget,
      duration,
      skillsRequired,
      deadline,
      clientId: req.userId,
    })

    await job.save()
    res.status(201).json({ job })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Update job status (clients only)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    const job = await Job.findById(req.params.id)

    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" })
    }

    job.status = status
    await job.save()
    res.json(job)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete a job (clients only)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }
    // Only the owner (client) can delete
    if (job.clientId.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" })
    }
    await Job.findByIdAndDelete(req.params.id)
    res.json({ message: "Job deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
