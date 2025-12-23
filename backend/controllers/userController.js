// the user roles and permission management controller 
import bcrypt from "bcryptjs";
import { readUsers, writeUsers } from "../models/userModel.js";
import { readUserLogs, writeUserLogs } from "../models/userLogModel.js";

// default permissions template for convenience (can be edited by Super Admin)
const MODULES = ["Events","Venues","Sports","Players","Teams","Franchise Panel","Scoring Panel","Commentary Panel"];
const defaultPermissionMatrix = () => MODULES.reduce((acc, m) => {
  acc[m] = { view: true, create: true, edit: true, delete: true };
  return acc;
}, {});

// ROLE DEFAULTS (for quick autofill in AddUser UI)
export const roleDefaults = {
  "Super Admin": defaultPermissionMatrix(),
  "Admin": defaultPermissionMatrix(),
  "Scorer": {
    Events: {view:true,create:false,edit:false,delete:false},
    Venues: {view:true,create:false,edit:false,delete:false},
    Sports: {view:true,create:false,edit:false,delete:false},
    Players: {view:true,create:false,edit:false,delete:false},
    Teams: {view:true,create:false,edit:false,delete:false},
    "Franchise Panel": {view:true,create:false,edit:false,delete:false},
    "Scoring Panel": {view:true,create:false,edit:true,delete:false},
    "Commentary Panel": {view:false,create:false,edit:false,delete:false}
  },
  "Commentator": {
    Events: {view:true,create:false,edit:false,delete:false},
    Venues: {view:true,create:false,edit:false,delete:false},
    Sports: {view:true,create:false,edit:false,delete:false},
    Players: {view:true,create:false,edit:false,delete:false},
    Teams: {view:true,create:false,edit:false,delete:false},
    "Franchise Panel": {view:false,create:false,edit:false,delete:false},
    "Scoring Panel": {view:false,create:false,edit:false,delete:false},
    "Commentary Panel": {view:true,create:true,edit:true,delete:false}
  },
  "Team Manager": {
    Events: {view:true,create:false,edit:false,delete:false},
    Venues: {view:true,create:false,edit:false,delete:false},
    Sports: {view:true,create:false,edit:false,delete:false},
    Players: {view:true,create:true,edit:true,delete:false},
    Teams: {view:true,create:true,edit:true,delete:false},
    "Franchise Panel": {view:false,create:false,edit:false,delete:false},
    "Scoring Panel": {view:false,create:false,edit:false,delete:false},
    "Commentary Panel": {view:false,create:false,edit:false,delete:false}
  },
  "Read-Only": MODULES.reduce((acc,m)=>{
    acc[m] = {view:true,create:false,edit:false,delete:false}; return acc;
  }, {})
};

// --------------------- helper ---------------------
const pushLog = (userId, action, meta = {}) => {
  const logs = readUserLogs();
  logs.unshift({
    id: Date.now(),
    userId,
    action,
    meta,
    timestamp: new Date().toISOString()
  });
  writeUserLogs(logs);
};

// --------------------- CRUD ---------------------
export const getUsers = (req, res) => {
  const users = readUsers().map(u => {
    const copy = {...u};
    delete copy.password; // don't leak
    return copy;
  });
  res.json(users);
};

export const addUser = async (req, res) => {
  const users = readUsers();
  const { fullName, email, mobile, password, status="Active", role="Read-Only", permissions } = req.body;

  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    fullName,
    email,
    mobile,
    password: hash,
    status,
    role,
    permissions: permissions || roleDefaults[role] || roleDefaults["Read-Only"],
    lastLogin: null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  pushLog(newUser.id, "USER_CREATED", { by: req.body.createdBy || "system" });
  const out = {...newUser}; delete out.password;
  res.status(201).json(out);
};

export const updateUser = async (req, res) => {
  const id = Number(req.params.id);
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  const { fullName, mobile, status, role, permissions, password } = req.body;
  if (fullName) users[idx].fullName = fullName;
  if (mobile) users[idx].mobile = mobile;
  if (status) users[idx].status = status;
  if (role) users[idx].role = role;
  if (permissions) users[idx].permissions = permissions;
  if (password) users[idx].password = await bcrypt.hash(password,10);

  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);

  pushLog(id, "USER_UPDATED", { by: req.body.updatedBy || "system" });
  const out = {...users[idx]}; delete out.password;
  res.json(out);
};

export const deleteUser = (req, res) => {
  const id = Number(req.params.id);
  const users = readUsers().filter(u => u.id !== id);
  writeUsers(users);
  pushLog(id, "USER_DELETED", {});
  res.json({ message: "User deleted" });
};

export const resetPassword = async (req, res) => {
  const id = Number(req.params.id);
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  // generate temporary password (simple) — you can change to email flow
  const temp = "Temp1234!";
  users[idx].password = await bcrypt.hash(temp, 10);
  writeUsers(users);

  pushLog(id, "PASSWORD_RESET", { tempBy: req.body.resetBy || "system" });
  res.json({ message: "Password reset", tempPassword: temp });
};

// get single user (no password)
export const getUser = (req, res) => {
  const id = Number(req.params.id);
  const u = readUsers().find(x => x.id === id);
  if (!u) return res.status(404).json({ error: "User not found" });
  const out = {...u}; delete out.password;
  res.json(out);
};

// update only permissions (Super Admin)
export const updatePermissions = (req, res) => {
  const id = Number(req.params.id);
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  users[idx].permissions = req.body.permissions;
  users[idx].role = req.body.role || users[idx].role;
  users[idx].updatedAt = new Date().toISOString();
  writeUsers(users);

  pushLog(id, "PERMISSIONS_UPDATED", { by: req.body.updatedBy || "system" });
  const out = {...users[idx]}; delete out.password;
  res.json(out);
};

// logs
export const getUserLogs = (req, res) => {
  const userId = Number(req.params.id);
  const logs = readUserLogs().filter(l => l.userId === userId);
  res.json(logs);
};
