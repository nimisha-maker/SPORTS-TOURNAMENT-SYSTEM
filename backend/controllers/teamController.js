import { readTeams, writeTeams } from "../models/teamModel.js";

export const getTeams = (req, res) => {
  const teams = readTeams();
  res.json(teams);
};

export const addTeam = (req, res) => {
  const teams = readTeams();
  const payload = req.body;

  const newTeam = {
    id: Date.now(),
    name: payload.name,
    sportId: payload.sportId,
    sportName: payload.sportName,
    players: payload.players || [],
    manager: payload.manager || {},
    status: payload.status || "Active",
    logo: payload.logo || "",
    createdAt: new Date().toISOString()
  };

  teams.push(newTeam);
  writeTeams(teams);
  res.status(201).json(newTeam);
};

export const editTeam = (req, res) => {
  const id = Number(req.params.id);
  const teams = readTeams();
  const idx = teams.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Team not found" });

  teams[idx] = {
    ...teams[idx],
    ...req.body,
    id: teams[idx].id, // preserve id
    updatedAt: new Date().toISOString()
  };

  writeTeams(teams);
  res.json(teams[idx]);
};

export const deleteTeam = (req, res) => {
  const id = Number(req.params.id);
  const teams = readTeams().filter(t => t.id !== id);
  writeTeams(teams);
  res.json({ message: "Team deleted" });
};
