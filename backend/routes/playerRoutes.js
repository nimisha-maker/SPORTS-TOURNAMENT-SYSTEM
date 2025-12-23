import express from "express";
import {
  addPlayer,
  getPlayers,
  deletePlayer,
  editPlayer,
  bulkUploadPlayers,
  getPlayerById,
  getPlayerMatchHistory
} from "../controllers/playerController.js";

const router = express.Router();

// 1. Keep the old route working for the Admin panel (no change needed here)
router.get("/all", getPlayers);


// 2. ADD the new route to satisfy the End-User Listing Page
router.get("/", getPlayers);
router.get("/:id", getPlayerById);
router.get("/:id/history", getPlayerMatchHistory);


router.post("/add", addPlayer);
router.post("/edit/:id", editPlayer);
router.delete("/delete/:id", deletePlayer);
router.post("/bulk-upload", bulkUploadPlayers);

export default router;
