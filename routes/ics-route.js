// routes/ics-route.js
import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../mongodbConfig.js";

const router = express.Router();

// GET /api/ics → fetch all ICS entries
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const data = await db.collection("ICS").find({}).sort({ timestamp: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ICS entries" });
  }
});

// GET /api/ics/:id → fetch ICS by ID
router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const doc = await db.collection("ICS").findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: "ICS entry not found" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ICS entry" });
  }
});

// POST /api/ics → add new ICS entry
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const newDoc = { ...req.body, timestamp: new Date() };
    const result = await db.collection("ICS").insertOne(newDoc);
    res.json({ _id: result.insertedId, ...newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add ICS entry" });
  }
});

// PUT /api/ics/:id → update ICS entry
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;
    const updateData = { ...req.body, updatedAt: new Date() };

    const result = await db.collection("ICS").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "ICS entry not found" });

    res.json({ _id: id, ...updateData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update ICS entry" });
  }
});

// DELETE /api/ics/:id → delete ICS entry
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("ICS").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "ICS entry not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete ICS entry" });
  }
});

// GET /api/ics/user/:userId → get ICS assigned to a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.params.userId;
    const items = await db.collection("ICS")
      .find({ assignedTo: userId })
      .sort({ timestamp: 1 })
      .toArray();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ICS for user" });
  }
});

export default router;
