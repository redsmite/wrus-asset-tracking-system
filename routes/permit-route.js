import express from "express";
import { ObjectId } from "mongodb";
import { connectDB } from "../mongodbConfig.js";

const router = express.Router();

// --------------------------
// GET /api/permits
// --------------------------
router.get("/", async (req, res) => {
  try {
    const db = await connectDB();
    const permits = await db.collection("permits").find({}).sort({ createdAt: -1 }).toArray();
    res.json(permits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch permits" });
  }
});

// --------------------------
// GET /api/permits/:id
// --------------------------
router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const permit = await db.collection("permits").findOne({ _id: new ObjectId(req.params.id) });
    if (!permit) return res.status(404).json({ error: "Permit not found" });
    res.json(permit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch permit" });
  }
});

// --------------------------
// POST /api/permits
// --------------------------
router.post("/", async (req, res) => {
  try {
    const db = await connectDB();
    const { permitNo, ...data } = req.body;
    if (!permitNo) return res.status(400).json({ error: "permitNo is required" });

    // Check duplicate
    const existing = await db.collection("permits").findOne({ permitNo: permitNo.trim() });
    if (existing) return res.status(400).json({ error: `Permit No "${permitNo}" already exists` });

    const doc = { permitNo: permitNo.trim(), ...data, createdAt: new Date() };
    const result = await db.collection("permits").insertOne(doc);
    res.json({ _id: result.insertedId, ...doc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add permit" });
  }
});

// --------------------------
// PUT /api/permits/:id
// --------------------------
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;
    const updateData = { ...req.body, updatedAt: new Date() };

    const result = await db.collection("permits").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: "Permit not found" });

    res.json({ _id: id, ...updateData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update permit" });
  }
});

// --------------------------
// DELETE /api/permits/:id
// --------------------------
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;

    const result = await db.collection("permits").deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: "Permit not found" });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete permit" });
  }
});

export default router;
