import fs from "fs";
import path from "path";

const filePath = path.resolve("db/events.json");

export const readEvents = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(data);
};

export const writeEvents = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
