import fs from "fs";
import path from "path";

const filePath = path.resolve("db/sports.json");

export const readSports = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(data);
};

export const writeSports = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
