import fs from "fs";
import bcrypt from "bcryptjs";

const dbPath = "./db/users.json";

// Helper to load users safely
const loadUsers = () => {
    try {
        const data = fs.readFileSync(dbPath, "utf8");
        return JSON.parse(data || "[]");
    } catch (err) {
        return [];
    }
};

// Helper to save users
const saveUsers = (users) => {
    fs.writeFileSync(dbPath, JSON.stringify(users, null, 2));
};

// REGISTER
export const registerUser = (req, res) => {
    const { full_name, email, password } = req.body;

    const users = loadUsers();

    if (users.find((u) => u.email === email)) {
        return res.status(400).json({
            success: false,
            message: "Email already exists",
        });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const newUser = {
        id: Date.now(),
        full_name,
        email,
        password: hashed,
        // FIX: Assign default role for new registrations
        role: "user", 
    };

    users.push(newUser);
    saveUsers(users);

    // OPTIONAL: Return the user object (with role) after successful registration
    return res.json({ success: true, message: "User registered", user: newUser });
};

// LOGIN
export const loginUser = (req, res) => {
    const { email, password } = req.body;

    const users = loadUsers();

    const user = users.find((u) => u.email === email);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "User not found",
        });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
        return res.status(401).json({
            success: false,
            message: "Wrong password",
        });
    }

    // FIX CHECK: This correctly returns the 'user' object, which now
    // includes the 'role' field (or should be manually added for existing users).
    // The password hash should be removed before sending to the client (best practice).
    const { password: _, ...userWithoutPass } = user;

    return res.json({
        success: true,
        message: "Login successful",
        user: userWithoutPass, // User object now contains the role
    });
};