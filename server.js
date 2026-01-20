import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import jobRoutes from "./routes/jobs.js"
import bidRoutes from "./routes/bids.js"
import paymentRoutes from "./routes/payments.js"
import ratingRoutes from "./routes/ratings.js"
import disputeRoutes from "./routes/disputes.js"
import adminRoutes from "./routes/admin.js"

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/freelance-marketplace")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err))

app.use("/api/auth", authRoutes)
app.use("/api/jobs", jobRoutes)
app.use("/api/bids", bidRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/ratings", ratingRoutes)
app.use("/api/disputes", disputeRoutes)
app.use("/api/admin", adminRoutes)

// const PORT = process.env.PORT || 5000
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

module.exports=app;
