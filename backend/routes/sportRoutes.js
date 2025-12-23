import express from "express";
import { getSports, addSport, updateSport, deleteSport } from "../controllers/sportController.js";

const router = express.Router();

router.get("/all", getSports);
router.post("/add", addSport);
router.put("/update/:id", updateSport);
router.delete("/delete/:id", deleteSport);

export default router;
