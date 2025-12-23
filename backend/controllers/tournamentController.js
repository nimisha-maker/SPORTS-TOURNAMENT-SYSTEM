// tournamentcontroller.js
import { readTournaments, writeTournaments } from "../models/tournamentModel.js";
import { readPlayers } from "../models/playermodel.js";
import { readTeams } from "../models/teamModel.js";
import { readVenues } from "../models/venueModel.js";

/* ---------------- GET ALL ---------------- */
export const getTournaments = (req, res) => {
    try {
        const list = readTournaments();
        res.json(Array.isArray(list) ? list : []);
    } catch (err) {
        console.error("Error fetching tournaments:", err);
        res.json([]);
    }
};

/* ---------------- GET ONE ---------------- */
export const getTournament = (req, res) => {
    try {
        const list = readTournaments();
        const id = Number(req.params.id);

        const t = list.find(x => Number(x.id) === id);

        if (!t) return res.status(404).json({ error: "Tournament not found" });

        // ensure required arrays exist
        t.events = Array.isArray(t.events) ? t.events : [];

        for (const ev of t.events) {
            ev.participants = Array.isArray(ev.participants) ? ev.participants : [];
            ev.fixtures = Array.isArray(ev.fixtures) ? ev.fixtures : [];
        }

        res.json(t);
    } catch (err) {
        console.error("Get Tournament Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/* ---------------- ADD TOURNAMENT ---------------- */
export const addTournament = (req, res) => {
    try {
        const list = readTournaments();

        const newT = {
            id: Date.now(),
            name: req.body.name || "",
            venue: req.body.venue || "",
            startDate: req.body.startDate || "",
            endDate: req.body.endDate || "",
            description: req.body.description || "",
            banner: req.body.banner || "",
            status: req.body.status || "Draft",
            sportType: req.body.sportType || "",
            events: Array.isArray(req.body.events) ? req.body.events : []
        };

        list.push(newT);
        writeTournaments(list);

        res.json(newT);
    } catch (err) {
        console.error("Add Tournament Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/* ---------------- EDIT TOURNAMENT ---------------- */
export const editTournament = (req, res) => {
    try {
        const list = readTournaments();
        const id = Number(req.params.id);
        const idx = list.findIndex(x => Number(x.id) === id);

        if (idx === -1)
            return res.status(404).json({ error: "Tournament not found" });

        const updated = {
            ...list[idx],
            ...req.body,
            id, // keep ID unchanged
            events: Array.isArray(req.body.events)
                ? req.body.events
                : list[idx].events || []
        };

        // ensure sub arrays
        updated.events = updated.events.map(ev => ({
  ...ev,
  participants: Array.isArray(ev.participants) ? ev.participants : [],
  fixtures: Array.isArray(ev.fixtures) ? ev.fixtures : [],
  rounds: Array.isArray(ev.rounds) ? ev.rounds : [] // ✅ IMPORTANT
}));


        list[idx] = updated;
        writeTournaments(list);

        res.json(updated);
    } catch (err) {
        console.error("Edit Tournament Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/* ---------------- DELETE TOURNAMENT ---------------- */
export const deleteTournament = (req, res) => {
    try {
        const list = readTournaments();
        const id = Number(req.params.id);

        const updated = list.filter(x => Number(x.id) !== id);
        writeTournaments(updated);

        res.json({ success: true });
    } catch (err) {
        console.error("Delete Tournament Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};

/* ---------------- FIXTURE GENERATION (placeholder) ---------------- */
export const generateFixturesForEvent = (req, res) => {
    res.json({ message: "Fixture generation handled on frontend" });
};

// Placeholder for getAllTeams (required if previously implemented)
export const getAllTeams = (req, res) => {
    res.json({ message: "Team list endpoint placeholder." });
};

// ---------------- END-USER  CONTROLLER ---------------- //

/**
 * Helper function to find match history for a single participant (Player or Team)
 * ENHANCED: Calculates and returns points scored and conceded.
 */
const calculateParticipantHistory = (participantId, isTeam, tournamentData) => {
    const participantIdStr = String(participantId);
    const history = [];

    for (const tournament of tournamentData) {
        for (const event of tournament.events || []) {
            
            // If checking for a team, verify the event type is Team/Double
            if (isTeam && event.type?.toLowerCase() !== "double" && event.type?.toLowerCase() !== "team") {
                continue;
            }
            
            for (const fixture of event.fixtures || []) {
                if (!fixture.teamA || !fixture.teamB) continue;

                // Check for involvement using teamA.id and teamB.id
                const isParticipantA = String(fixture.teamA.id) === participantIdStr;
                const isParticipantB = String(fixture.teamB.id) === participantIdStr;

                if (isParticipantA || isParticipantB) {
                    let result = 'Incomplete';
                    let scored = 0;
                    let conceded = 0;
                    
                    // Determine Win/Loss, Scored, and Conceded based on score
                    if (fixture.status === 'Completed' && fixture.score) {
                        const scoreA = fixture.score.a || 0;
                        const scoreB = fixture.score.b || 0;
                        
                        if (isParticipantA) {
                            scored = scoreA;
                            conceded = scoreB;
                        } else if (isParticipantB) {
                            scored = scoreB;
                            conceded = scoreA;
                        }

                        if (scoreA > scoreB) {
                            result = isParticipantA ? 'Win' : 'Loss';
                        } else if (scoreB > scoreA) {
                            result = isParticipantB ? 'Win' : 'Loss';
                        } else if (scoreA === scoreB && scoreA !== 0) {
                            result = 'Draw';
                        }
                    } 
                    
                    history.push({ result, scored, conceded }); // Include points data
                }
            }
        }
    }
    return history;
};

/**
 * Controller to generate standings for a specific tournament event.
 * Route: GET /api/tournaments/:tournamentId/events/:eventId/standings
 * ENHANCED: Includes PD calculation and custom participant name formatting.
 */
export const getEventStandings = (req, res) => {
    const tournamentId = req.params.tournamentId;
    const eventId = req.params.eventId;
    
    try {
        const allTournaments = readTournaments();
        const tournament = allTournaments.find(t => String(t.id) === tournamentId);

        if (!tournament) return res.status(404).json({ message: "Tournament not found." });

        const event = tournament.events.find(e => e.id === eventId);
        
        if (!event) return res.status(404).json({ message: "Event not found." });

        const standings = [];
        const eventType = event.type?.toLowerCase();
        const isTeamOrDouble = eventType === "double" || eventType === "team";
        
        // Loop through all participants (players or teams) in the event
        for (const participant of event.participants || []) {
            
            const participantId = participant.id;
            
            // 1. Calculate history (including points scored/conceded)
            const history = calculateParticipantHistory(participantId, isTeamOrDouble, [tournament]);
            
            const totalMatches = history.length;
            const wins = history.filter(item => item.result === 'Win').length;
            const losses = history.filter(item => item.result === 'Loss').length;
            const draws = history.filter(item => item.result === 'Draw').length;
            
            // 🚨 NEW CALCULATION: Sum points scored and conceded
            const pointsScored = history.reduce((sum, item) => sum + (item.scored || 0), 0);
            const pointsConceded = history.reduce((sum, item) => sum + (item.conceded || 0), 0);
            const pointDifference = pointsScored - pointsConceded; // Point Difference (PD)

            // Calculate metrics
            const winRate = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;
            const points = (wins * 2) + (draws * 1); // Simple points system

            // 🚨 CUSTOM NAME FORMATTING LOGIC 🚨
            let participantName;
            
            if (eventType === "single") {
                // For singles, just use the player's full name
                participantName = `${participant.firstName} ${participant.lastName}`.trim();
            } else if (isTeamOrDouble) {
                // For Doubles/Teams, use TeamName (small) and Player names (large)
                const teamName = participant.teamName || participant.name;
                
                let playerNames = '';
                if (participant.players && participant.players.length > 0) {
                    playerNames = participant.players
                        .map(p => p.name || `${p.firstName} ${p.lastName}`.trim())
                        .join(' & ');
                }
                
                // Combining team name and player names for the frontend display
                // The frontend must use CSS/HTML to handle the line break and small text.
                // We'll use a delimiter here that the frontend can split on.
                participantName = `${teamName} \u2014 ${playerNames}`; // Use long dash as a clear visual separator
            } else { 
                // Default fallback
                participantName = participant.teamName || participant.name || `${participant.firstName} ${participant.lastName}`.trim();
            }
            
            // 2. Aggregate the stats
            standings.push({
                id: participantId,
                name: participantName, // Contains custom format for Teams/Doubles
                totalMatches,
                wins,
                losses,
                draws,
                winRate: Number(winRate),
                points,
                pointDifference // PD is included
            });
        }
        
        // 3. Sort the standings: Pts > PD > Win Rate > Wins
        standings.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference; // Sort by PD next
            if (b.winRate !== a.winRate) return b.winRate - a.winRate;
            return b.wins - a.wins;
        });

        // 4. Add the final rank
        const finalStandings = standings.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        res.json(finalStandings);
        
    } catch (error) {
        console.error(`Error generating standings for T:${tournamentId}, E:${eventId}:`, error);
        res.status(500).json({ message: "Internal server error while fetching standings." });
    }
};


/* ---------------- UPDATED DASHBOARD STATS ---------------- */
export const getDashboardStats = (req, res) => {
    try {
        // 1. Fetch data from all specific models for 100% accuracy
        const tournaments = readTournaments();
        const players = readPlayers();
        const teams = readTeams(); // Pulls from teamModel.js
        const venues = readVenues(); // Pulls from venueModel.js

        // 2. Calculate Active Tournaments based on status
        // We look for "Active", "Live", or "Ongoing" status
        const activeTournaments = tournaments.filter(t => 
            ["active", "live", "ongoing"].includes(t.status?.toLowerCase())
        ).length;

        // 3. Prepare the final response
        res.json({
            totalPlayers: players.length,
            totalTeams: teams.length,
            totalVenues: venues.length,
            activeTournaments: activeTournaments || tournaments.length,
            // Show last 3 tournaments for the "Ongoing & Recent" section
            recentTournaments: tournaments.slice(-3).reverse() 
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};