import fs from "fs";
import path from "path";
const filePath = path.resolve("db/userLogs.json");

export const readUserLogs = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(data);
};

export const writeUserLogs = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
