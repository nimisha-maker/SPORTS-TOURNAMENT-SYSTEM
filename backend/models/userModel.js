// for the user roles and permission given by the super admin 
import fs from "fs";
import path from "path";
const filePath = path.resolve("db/users.json");

export const readUsers = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8") || "[]";
  return JSON.parse(data);
};

export const writeUsers = (data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
