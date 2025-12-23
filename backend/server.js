import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import sportRoutes from "./routes/sportRoutes.js";
import playerRoutes from "./routes/playerRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import tournamentRoutes from "./routes/tournamentRoutes.js";

const app = express();
app.use(cors());

// FIX 413 ERROR
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sports", sportRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tournaments", tournamentRoutes);


app.listen(5000, () => console.log("Server running on port 5000"));
