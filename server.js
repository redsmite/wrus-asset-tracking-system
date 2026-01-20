import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import usersRouter from "./routes/users-route.js";
import permitRouter from "./routes/permit-route.js";
import wusRouter from "./routes/wus-route.js";
import icsRouter from "./routes/ics-route.js";
import consumableRouter from "./routes/consumable-route.js";
import ledgerRouter from "./routes/ledger-route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/users", usersRouter);
app.use("/api/permits", permitRouter);
app.use("/api/wus", wusRouter);
app.use("/api/ics", icsRouter);
app.use("/api/consumable", consumableRouter);
app.use("/api/ledger", ledgerRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
