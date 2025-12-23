import express from "express";
import { addVenue, getVenues, deleteVenue } from "../controllers/venueController.js";

const router = express.Router();

router.get("/all", getVenues);
router.post("/add", addVenue);
router.delete("/delete/:id", deleteVenue);

export default router;
