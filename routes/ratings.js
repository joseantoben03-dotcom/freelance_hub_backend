import express from "express"
import Rating from "../models/Rating.js"
import User from "../models/User.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get ratings for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const ratings = await Rating.find({ toUserId: req.params.userId }).populate("fromUserId", "firstName lastName")
    res.json(ratings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create rating (mandatory after job completion)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { jobId, toUserId, rating, review } = req.body

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" })
    }

    const existingRating = await Rating.findOne({ jobId, fromUserId: req.userId })
    if (existingRating) {
      return res.status(400).json({ error: "You already rated this job" })
    }

    const newRating = new Rating({
      jobId,
      fromUserId: req.userId,
      toUserId,
      rating,
      review,
    })

    await newRating.save()

    // Update user's average rating
    const allRatings = await Rating.find({ toUserId })
    const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    await User.findByIdAndUpdate(toUserId, { averageRating: avgRating })

    res.status(201).json(newRating)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
