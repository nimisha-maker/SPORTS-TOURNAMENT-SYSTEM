import fs from "fs";
import path from "path";

const filePath = path.resolve("db/venues.json");

// READ JSON
export const readVenues = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(data);
};

// WRITE JSON
export const writeVenues = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
