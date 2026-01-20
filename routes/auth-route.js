import express from "express";
import bcrypt from "bcryptjs";
import { connectDB } from "../mongodbConfig.js"

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  try {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const role = user.role?.toLowerCase();
    const status = user.status?.toLowerCase();
    const type = user.type || "";

    if (role !== "admin" && status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact the administrator."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    const fullName = `${user.firstName} ${user.middleInitial || ""} ${user.lastName}`;

    res.json({
      userId: user._id || user.id, // Firestore ID fallback
      fullName,
      role,
      type
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
