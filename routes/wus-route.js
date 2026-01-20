import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../mongodbConfig.js";

const router = express.Router();

// --------------------------
// GET /api/wus
// --------------------------
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const data = await db.collection("water_users").find({}).sort({ timestamp: -1 }).toArray();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch WUS data" });
  }
});

// --------------------------
// GET /api/wus/:id
// --------------------------
router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const doc = await db.collection("water_users").findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: "WUS entry not found" });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch WUS entry" });
  }
});

// --------------------------
// POST /api/wus
// --------------------------
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const newDoc = { ...req.body, timestamp: new Date() };
    const result = await db.collection("water_users").insertOne(newDoc);
    res.json({ _id: result.insertedId, ...newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add WUS entry" });
  }
});

// --------------------------
// PUT /api/wus/:id
// --------------------------
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;
    const updateData = { ...req.body, updatedAt: new Date() };

    const result = await db.collection("water_users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "WUS entry not found" });

    res.json({ _id: id, ...updateData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update WUS entry" });
  }
});

// --------------------------
// DELETE /api/wus/:id
// --------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection("water_users").deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "WUS entry not found" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete WUS entry" });
  }
});

export default router;
