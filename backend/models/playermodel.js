import fs from "fs";
import path from "path";

const filePath = path.resolve("db/players.json");

// READ DB
export const readPlayers = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data || "[]");
};

// WRITE DB
export const writePlayers = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
