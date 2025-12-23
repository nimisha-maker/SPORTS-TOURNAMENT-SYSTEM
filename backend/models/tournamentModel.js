import fs from "fs";
import path from "path";

const filePath = path.resolve("db/tournaments.json");

// Read + fallback
export const readTournaments = () => {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, "utf-8") || "[]";

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Write safely
export const writeTournaments = (data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed writing tournaments.json:", err);
  }
};
