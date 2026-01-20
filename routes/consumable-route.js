import express from "express";
import { connectDB } from "../mongodbConfig.js"; 
import { Ledger } from "../public/js/data/cache/ledger-data.js"; // Node.js version of Ledger

const router = express.Router();

// In-memory cache
let consumableCache = [];

// Fetch all consumables
router.get("/", async (req, res) => {
  try {
    if (!consumableCache.length) {
      const db = await connectDB();
      consumableCache = await db
        .collection("consumable")
        .find({})
        .sort({ timestamp: -1 })
        .toArray();
    }
    res.json(consumableCache);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new consumable
router.post("/", async (req, res) => {
  try {
    const { specification, qty, unit, addedBy, remarks } = req.body;
    const db = await connectDB();

    // Generate ID like "2026-001"
    const year = new Date().getFullYear();
    const prefix = `${year}-`;
    const count = (await db.collection("consumable").countDocuments({ id: { $regex: `^${prefix}` } })) + 1;
    const id = `${prefix}${String(count).padStart(3, "0")}`;

    const newItem = {
      id,
      specification,
      qty: Number(qty),
      unit,
      addedBy,
      timestamp: new Date(),
    };

    await db.collection("consumable").insertOne(newItem);

    // Add entry to Ledger
    await Ledger.addEntry({
      cid: id,
      modifiedBy: addedBy,
      amount: Number(qty),
      remarks: remarks || "Opening stock",
      action: "Add Stock",
    });

    consumableCache.unshift(newItem); // update cache
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get consumable by ID
router.get("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const item = await db.collection("consumable").findOne({ id: req.params.id });
    if (!item) return res.status(404).json({ error: "Consumable not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update consumable
router.put("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const updated = req.body;

    await db.collection("consumable").updateOne({ id: req.params.id }, { $set: updated });
    consumableCache = consumableCache.map(item =>
      item.id === req.params.id ? { ...item, ...updated } : item
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete consumable
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    await db.collection("consumable").deleteOne({ id: req.params.id });
    consumableCache = consumableCache.filter(item => item.id !== req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
