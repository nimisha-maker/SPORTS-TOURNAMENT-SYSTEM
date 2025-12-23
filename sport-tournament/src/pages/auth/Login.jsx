// src/pages/auth/Login.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import logo from "../../assets/image 14.png";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null); // Added state for error messages
    const [loading, setLoading] = useState(false); // Added state for loading state

    const handleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok && data.success) { 
                alert("Login Successful!");
                
                // 1. --- STORE TOKEN & ROLE ---
                // CRITICAL: Storing token and role for the ProtectedRoute component
                localStorage.setItem('token', data.token); 
                const userRole = data.user?.role; 
                
                if (!userRole) {
                    throw new Error("Missing role in API response. Defaulting to general user.");
                }
                localStorage.setItem('userRole', userRole); 
                // -----------------------------

                // 2. --- ROLE-BASED REDIRECTION ---
                // Navigates user to their designated landing page
                switch (userRole) {
                    case 'Super Admin':
                    case 'Admin':
                        navigate("/admin/dashboard");
                        break;
                    case 'Scorer':
                        navigate("/scorer/live-scoring"); // Dedicated Scorer interface
                        break;
                    case 'Commentator':
                        navigate("/commentator/feed"); // Dedicated Commentator interface
                        break;
                    case 'Team Manager':
                    case 'Read-Only':
                    case 'user': // Assuming 'user' is a low-privilege role
                    default:
                        // Default landing page for end-users/viewers
                        navigate("/user/dashboard"); 
                        break;
                }

            } else {
                setError(data.message || "Login failed. Check your credentials.");
            }
        } catch (error) {
            setLoading(false);
            console.error("Login failed:", error);
            setError(error.message || "Server error or failed to connect.");
        }
    };
    
    return (
        <AuthLayout>
            <div className="flex flex-col items-center mb-8">
                <img src={logo} alt="Logo" className="w-35 h-20" />
                <h2 className="text-3xl text-white font-bold mt-4">Welcome Back</h2>
                <p className="text-gray-300 mt-1 text-sm">Login to your account</p>
            </div>

            <div className="max-w-md w-full bg-gray-800/90 p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-6">
                <div>
                    <label className="text-gray-200 font-medium">Email</label>
                    <input
                        type="email"
                        className="w-full mt-2 px-4 py-3 bg-gray-700/30 text-white rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none placeholder-gray-400"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-gray-200 font-medium">Password</label>
                    <input
                        type="password"
                        className="w-full mt-2 px-4 py-3 bg-gray-700/30 text-white rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none placeholder-gray-400"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                {/* Display Error Message */}
                {error && (
                    <div className="text-red-400 text-sm p-2 bg-red-900/50 rounded text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={loading} // Disable button during loading
                    className="w-full py-3 bg-linear-to-r from-pink-500 to-purple-600 font-semibold rounded-xl shadow-lg hover:scale-105 transform transition-all duration-300 disabled:opacity-50"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            
                <div className="text-center text-gray-300 mt-2 text-sm">
                    New user?{" "}
                    <Link to="/register" className="text-pink-400 hover:text-purple-400 font-semibold transition-colors">
                        Create an account
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}