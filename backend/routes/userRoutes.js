import express from "express";
import {
  getUsers, addUser, updateUser, deleteUser, resetPassword, getUser, updatePermissions, getUserLogs
} from "../controllers/userController.js";

const router = express.Router();

router.get("/all", getUsers);
router.get("/:id", getUser);
router.post("/add", addUser);
router.post("/edit/:id", updateUser);
router.delete("/delete/:id", deleteUser);
router.post("/reset-password/:id", resetPassword);

// Super Admin only endpoint to update permissions
router.post("/permissions/:id", updatePermissions);

// logs
router.get("/logs/:id", getUserLogs);

export default router;
