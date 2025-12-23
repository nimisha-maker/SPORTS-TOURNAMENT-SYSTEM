// backend/routes/tournamentRoutes.js
import express from "express";
import {
  getTournaments, addTournament, editTournament, deleteTournament, getTournament, generateFixturesForEvent, getEventStandings,getDashboardStats,
} from "../controllers/tournamentController.js";

const router = express.Router();

router.get("/all", getTournaments);
router.get("/stats/overview", getDashboardStats);
router.get("/:id", getTournament);
router.post("/add", addTournament);
router.post("/edit/:id", editTournament);
router.delete("/delete/:id", deleteTournament);

// generate fixtures for a event
router.post("/generate-fixtures/:tid/:eid", generateFixturesForEvent);


//  ROUTE ADDED FOR STANDINGS PAGE (END-USER)
router.get("/:tournamentId/events/:eventId/standings", getEventStandings);

export default router;
