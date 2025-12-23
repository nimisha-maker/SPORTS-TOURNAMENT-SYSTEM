import express from "express";
import { getTeams, addTeam, editTeam, deleteTeam } from "../controllers/teamController.js";

const router = express.Router();

router.get("/all", getTeams);
router.post("/add", addTeam);
router.post("/edit/:id", editTeam);
router.delete("/delete/:id", deleteTeam);

export default router;
