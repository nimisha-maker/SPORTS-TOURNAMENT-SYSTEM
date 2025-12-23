import { readVenues, writeVenues } from "../models/venueModel.js";

// GET ALL VENUES
export const getVenues = (req, res) => {
  const venues = readVenues();
  res.json(venues);
};

// ADD VENUE
export const addVenue = (req, res) => {
  const venues = readVenues();

  const newVenue = {
    id: Date.now(),  // numeric ID
    ...req.body,
  };

  venues.push(newVenue);
  writeVenues(venues);

  res.json(newVenue);
};

// DELETE VENUE
export const deleteVenue = (req, res) => {
  const venues = readVenues();
  const id = Number(req.params.id);

  const filtered = venues.filter(v => v.id !== id);

  if (filtered.length === venues.length) {
    return res.status(404).json({ message: "Venue not found" });
  }

  writeVenues(filtered);
  res.json({ message: "Venue deleted successfully" });
};
