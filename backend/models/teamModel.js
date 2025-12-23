import fs from "fs";
import path from "path";

const filePath = path.resolve("db/teams.json");

export const readTeams = () => {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(raw);
};

export const writeTeams = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
