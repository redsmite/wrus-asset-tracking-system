import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../mongodbConfig.js"

const router = express.Router();

// --------------------------
// GET /api/users
// --------------------------
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection("users").find({}).sort({ timestamp: -1 }).toArray();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// --------------------------
// GET /api/users/:id
// --------------------------
router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// --------------------------
// POST /api/users
// --------------------------
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const doc = { ...req.body, timestamp: new Date() };
    const result = await db.collection("users").insertOne(doc);
    res.json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add user" });
  }
});

// --------------------------
// PUT /api/users/:id
// --------------------------
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;
    const updateData = { ...req.body, updatedAt: new Date() };

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "User not found" });

    res.json({ _id: id, ...updateData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// --------------------------
// DELETE /api/users/:id
// --------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
