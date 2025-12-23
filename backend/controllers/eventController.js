import { readEvents, writeEvents } from "../models/eventModel.js";

export const getEvents = (req, res) => {
  const events = readEvents();
  res.json(events);
};

export const addEvent = (req, res) => {
  const events = readEvents();

  const newEvent = {
    id: Date.now(),
    ...req.body,
  };

  events.push(newEvent);
  writeEvents(events);

  res.json(newEvent);
};

export const updateEvent = (req, res) => {
  const events = readEvents();
  const id = Number(req.params.id);

  const index = events.findIndex(e => e.id === id);
  if (index === -1) return res.status(404).json({ message: "Event not found" });

  events[index] = { ...events[index], ...req.body };
  writeEvents(events);

  res.json(events[index]);
};

export const deleteEvent = (req, res) => {
  const events = readEvents();
  const id = Number(req.params.id);

  const filtered = events.filter(e => e.id !== id);

  if (filtered.length === events.length)
    return res.status(404).json({ message: "Event not found" });

  writeEvents(filtered);
  res.json({ message: "Event deleted successfully" });
};
