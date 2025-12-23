import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import logo from "../../assets/image 14.png";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
    // ... inside the handleRegister function in your Register component ...

      if (data.success) {
        // Change the alert message to reflect the new flow
        alert("Registration successful! Please log in with your new account.");
        
        // --- THE FIX: Redirect to the Login Page ---
        
        // Assuming your Login page is mounted at the root path: "/"
        navigate("/"); 

        // --- END FIX ---
        
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Registration failed:", error);
   alert("Server error or failed to connect.");
   }
 };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center mb-6">
        <img src={logo} alt="Logo" className="w-20 h-20 mb-2" />
        <h2 className="text-2xl text-white font-semibold">Create Account</h2>
        <p className="text-blue-200 text-sm">Register to continue</p>
      </div>

      <div className="max-w-md w-full bg-gray-800/90 p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-4">
        <div>
          <label className="text-white">Full Name</label>
          <input
            type="text"
            name="full_name"
            className="w-full mt-1 px-3 py-2 bg-white/20 text-white rounded-md focus:ring-2 focus:ring-yellow-300 outline-none"
            placeholder="Enter full name"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-white">Email</label>
          <input
            type="email"
            name="email"
            className="w-full mt-1 px-3 py-2 bg-white/20 text-white rounded-md focus:ring-2 focus:ring-yellow-300 outline-none"
            placeholder="Enter email"
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="text-white">Password</label>
          <input
            type="password"
            name="password"
            className="w-full mt-1 px-3 py-2 bg-white/20 text-white rounded-md focus:ring-2 focus:ring-yellow-300 outline-none"
            placeholder="Enter password"
            onChange={handleChange}
          />
        </div>

        <button
          onClick={handleRegister}
          className="w-full py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition"
        >
          Register
        </button>

        <div className="text-center text-white mt-4">
          Already have an account?{" "}
          <Link to="/" className="text-yellow-300 font-semibold">
            Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}