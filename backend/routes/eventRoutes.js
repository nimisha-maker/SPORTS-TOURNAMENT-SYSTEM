import express from "express";
import { getEvents, addEvent, updateEvent, deleteEvent } from "../controllers/eventController.js";

const router = express.Router();

router.get("/all", getEvents);
router.post("/add", addEvent);
router.put("/update/:id", updateEvent);
router.delete("/delete/:id", deleteEvent);

export default router;
