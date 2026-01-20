import express from "express"
import jwt from "jsonwebtoken"
import bcryptjs from "bcryptjs"
import User from "../models/User.js"

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" })
    }

    const user = new User({ email, password, firstName, lastName, role })
    await user.save()

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    res.status(201).json({ token, user: { id: user._id, email, firstName, lastName, role } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret", {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: { id: user._id, email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get current user (for auth check)
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")
    if (!token) {
      return res.status(401).json({ error: "No token provided" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret")
    const user = await User.findById(decoded.userId).select("-password")
    
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ 
      user: { 
        id: user._id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role 
      } 
    })
  } catch (error) {
    res.status(401).json({ error: "Invalid token" })
  }
})

export default router
