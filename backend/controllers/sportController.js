import { readSports, writeSports } from "../models/sportModel.js";

// GET ALL
export const getSports = (req, res) => {
  const sports = readSports();
  res.json(sports);
};

// ADD
export const addSport = (req, res) => {
  const sports = readSports();

  const newSport = {
    id: Date.now(),
    ...req.body
  };

  sports.push(newSport);
  writeSports(sports);

  res.json(newSport);
};

// UPDATE
export const updateSport = (req, res) => {
  const id = Number(req.params.id);
  const sports = readSports();
  const idx = sports.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ message: "Sport not found" });

  sports[idx] = { ...sports[idx], ...req.body };
  writeSports(sports);

  res.json(sports[idx]);
};

// DELETE
export const deleteSport = (req, res) => {
  const id = Number(req.params.id);
  const sports = readSports();

  const filtered = sports.filter((s) => s.id !== id);
  if (filtered.length === sports.length) {
    return res.status(404).json({ message: "Sport not found" });
  }

  writeSports(filtered);
  res.json({ message: "Sport deleted" });
};
