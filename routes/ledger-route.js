import express from "express";
import { connectDB } from "../mongodbConfig.js"; // Node.js MongoDB connection
import { Consumable } from "../public/js/data/cache/consumable-data.js"

const router = express.Router();

// In-memory cache (like your frontend localStorage)
let ledgerCache = [];

// Fetch all ledger entries
router.get("/", async (req, res) => {
  try {
    if (!ledgerCache.length) {
      const db = await connectDB();
      ledgerCache = await db
        .collection("ledger")
        .find({})
        .sort({ dateModified: -1 })
        .toArray();
    }
    res.json(ledgerCache);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a ledger entry
router.post("/", async (req, res) => {
  try {
    const { cid, modifiedBy, amount, remarks, action, assignedTo } = req.body;
    const db = await connectDB();
    const entry = {
      cid,
      modifiedBy,
      amount: Number(amount),
      remarks: remarks?.trim() || "",
      action,
      assignedTo: assignedTo || "",
      dateModified: new Date(),
    };
    const result = await db.collection("ledger").insertOne(entry);
    const newEntry = { _id: result.insertedId, ...entry };
    ledgerCache.unshift(newEntry); // update cache
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get ledger by CID
router.get("/cid/:cid", async (req, res) => {
  try {
    const db = await connectDB();
    const cid = req.params.cid;

    const ledgerEntries = await db
      .collection("ledger")
      .find({ cid })
      .sort({ dateModified: -1 })
      .toArray();

    // Get total quantity from Consumable object
    const totalQty = await Consumable.getQty(cid);

    res.json({ totalQty: totalQty ?? 0, ledgerEntries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete ledger entry
router.delete("/:id", async (req, res) => {
  try {
    const db = await connectDB();
    const id = req.params.id;
    await db.collection("ledger").deleteOne({ _id: id });
    ledgerCache = ledgerCache.filter(e => e._id.toString() !== id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
