import { readPlayers, writePlayers } from "../models/playermodel.js";
// for the end-user player profile page
import { readTournaments } from "../models/tournamentModel.js";

// ADD PLAYER
export const addPlayer = (req, res) => {
  const players = readPlayers();
  const newPlayer = { id: Date.now(), ...req.body };
  players.push(newPlayer);
  writePlayers(players);
  res.status(201).json(newPlayer);
};

// EDIT PLAYER
export const editPlayer = (req, res) => {
  const players = readPlayers();
  const playerId = Number(req.params.id);

  const index = players.findIndex((p) => p.id === playerId);
  if (index === -1) return res.status(404).json({ message: "Player not found" });

  players[index] = { ...players[index], ...req.body };
  writePlayers(players);
  res.json(players[index]);
};

// GET ALL PLAYERS
export const getPlayers = (req, res) => {
  const players = readPlayers();
  res.json(players);
};

// --- NEW FUNCTIONALITY FOR END-USER PROFILE PAGE START ---

// GET PLAYER BY ID (Handles GET /api/players/:id)
export const getPlayerById = (req, res) => {
    const players = readPlayers();
    const playerId = Number(req.params.id);

    // Find the player in the array
    const player = players.find((p) => p.id === playerId);

    if (!player) {
        // Sends the 404 response that the frontend is expecting and reporting
        return res.status(404).json({ message: "Player not found" });
    }

    // Success: Return the player object
    res.status(200).json(player);
};

// GET PLAYER MATCH HISTORY (Handles GET /api/players/:id/history)
export const getPlayerMatchHistory = (req, res) => { 
    const playerId = Number(req.params.id);

    if (isNaN(playerId)) {
        return res.status(400).json({ message: "Invalid Player ID." });
    }

    try {
        const allTournaments = readTournaments();
        const allPlayers = readPlayers();
        const matchHistory = [];

        for (const tournament of allTournaments) {
            if (Array.isArray(tournament.events)) {
                for (const event of tournament.events) {
                    
                    let participantIdToSearch = null; 
                    const eventType = event.type?.toLowerCase();

                    // 1. Determine the relevant Participant ID (Player ID or Team ID)
                    if (eventType === "double" || eventType === "team") {
                        // Search teams to find the team ID the player belongs to
                        const team = event.participants?.find(p => 
                            p.players?.some(player => Number(player.id) === playerId)
                        );
                        if (team) {
                            participantIdToSearch = team.id; 
                        }
                    } else if (eventType === "individual") {
                         // For Individual/Singles events, the player is the participant.
                        participantIdToSearch = playerId;
                    }
                    
                    // 2. Search Fixtures
                    if (participantIdToSearch && Array.isArray(event.fixtures)) {
                        
                        for (const fixture of event.fixtures) {
                            
                            // Check if fixture.teamA or fixture.teamB is null (e.g., a bye or pending advancement)
                            if (!fixture.teamA || !fixture.teamB) continue;

                            const matchIdToSearchStr = String(participantIdToSearch);

                            // 🚨 CRITICAL FIX: Match against the nested 'id' fields
                            const isParticipantA = String(fixture.teamA.id) === matchIdToSearchStr;
                            const isParticipantB = String(fixture.teamB.id) === matchIdToSearchStr;
                            
                            if (isParticipantA || isParticipantB) {
                                let result = 'Incomplete';
                                
                                // 3. Determine Match Result based on 'score' object
                                if (fixture.status === 'Completed' && fixture.score) {
                                    const scoreA = fixture.score.a;
                                    const scoreB = fixture.score.b;
                                    
                                    if (scoreA > scoreB) {
                                        result = isParticipantA ? 'Win' : 'Loss';
                                    } else if (scoreB > scoreA) {
                                        result = isParticipantB ? 'Win' : 'Loss';
                                    } else if (scoreA === scoreB && scoreA !== null) {
                                        result = 'Draw';
                                    }
                                } else if (fixture.status === 'Scheduled') {
                                    result = 'Scheduled';
                                }

                                // 4. Determine Opponent
                                const opponentTeamObject = isParticipantA ? fixture.teamB : fixture.teamA;
                                const opponentParticipantId = opponentTeamObject.id;
                                const opponentName = opponentTeamObject.name || `Participant ${opponentParticipantId}`;

                                // 5. Push to History
                                matchHistory.push({
                                    id: fixture.id,
                                    matchId: fixture.id,
                                    tournamentId: tournament.id,
                                    tournamentName: tournament.name,
                                    eventDetails: event.label, 
                                    opponentId: opponentParticipantId,
                                    opponentName: opponentName,
                                    matchDetails: `vs ${opponentName} in ${event.label}`,
                                    date: fixture.scheduledAt || 'N/A',
                                    result: result,
                                });
                            }
                        }
                    }
                }
            }
        }

        return res.status(200).json(matchHistory);

    } catch (error) {
        console.error(`Error fetching history for Player ${playerId}:`, error);
        return res.status(500).json({ message: "Internal server error while fetching match history." });
    }
};
// ---  FOR END-USER PROFILE PAGE END ---

// DELETE PLAYER
export const deletePlayer = (req, res) => {
  const players = readPlayers();
  const filtered = players.filter((p) => p.id !== Number(req.params.id));
  writePlayers(filtered);
  res.json({ message: "Player deleted" });
};

// BULK UPLOAD PLAYERS
export const bulkUploadPlayers = (req, res) => {
  const existingPlayers = readPlayers();
  const newPlayers = req.body;

  const merged = [...existingPlayers, ...newPlayers];
  writePlayers(merged);

  res.status(201).json({ message: "Bulk upload successful" });
};