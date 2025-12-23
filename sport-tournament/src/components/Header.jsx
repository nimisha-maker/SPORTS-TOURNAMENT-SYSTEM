import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Added Import
import { Bell, Settings, ChevronDown } from "lucide-react";
import profilePic from "../assets/download.jpeg";

export default function Header() {
  const navigate = useNavigate(); // 2. Initialized Navigate
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, text: "New tournament created", time: "2 min ago" },
    { id: 2, text: "Player registration approved", time: "1 hour ago" },
    { id: 3, text: "Team added to league", time: "Yesterday" },
  ];

  // 3. Added Logout logic
  const handleLogout = () => {
    // Optional: Clear tokens if you use them
    // localStorage.clear(); 
    navigate("/");
  };

  return (
    <div className="w-full bg-white text-gray-900 px-6 py-4 flex justify-end items-center shadow-[0_4px_15px_rgba(0,0,0,0.15)] relative z-40">
      <div className="flex items-center gap-6 relative">

        {/* NOTIFICATION SECTION */}
        <div className="relative">
          <Bell
            className="w-6 h-6 cursor-pointer text-gray-600 hover:text-blue-700 transition"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
          />
          
          {/* Badge */}
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {notifications.length}
          </span>

          {/* Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.18)] border p-4 animate-[fadeIn_0.2s_ease]">
              <h3 className="font-semibold text-gray-700 mb-3 text-lg">Notifications</h3>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scroll">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg mb-2 bg-gray-50 hover:bg-gray-100 transition border">
                    <p className="text-gray-900">{n.text}</p>
                    <span className="text-xs text-gray-500">{n.time}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full text-center py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                View All
              </button>
            </div>
          )}
        </div>
        
        {/* SETTINGS ICON */}
        <Settings className="w-6 h-6 cursor-pointer text-gray-600 hover:text-blue-700 transition" />

        {/* PROFILE SECTION */}
        <div className="relative">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
          >
            <img
              src={profilePic}
              alt="profile"
              className="w-10 h-10 rounded-full border-2 border-blue-600 object-cover"
            />
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </div>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_8px_25px_rgba(0,0,0,0.18)] border p-2 animate-[fadeIn_0.2s_ease]">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition font-medium">
                My Profile
              </button>

              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition font-medium">
                Settings
              </button>

              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition font-medium text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}