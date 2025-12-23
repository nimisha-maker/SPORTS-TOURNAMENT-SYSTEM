import { NavLink } from "react-router-dom";
import logo from "../assets/image 14.png";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/user/dashboard" },
    { name: "Event listing", path: "/user/event_listing" },
    { name: "Fixtures", path: "/user/fixtures" },
    { name: "Standings", path: "/user/standings" },
    // { name: "Teams & players", path: "/user/players" },
    // { name: "Live match", path: "/user/live_match" },
    // { name: "Scorecard", path: "/user/scorecard" },
    // { name: "Assign Player", path: "/admin/assign-player" },
    { name: "Teams", path: "/user/teams" },
    { name: "Player statistic", path: "/user/player_stats" },
    
  ];

  return (
    <div className="w-64 min-h-screen bg-blue-950 text-white flex flex-col shadow-xl">

      {/* Logo Section */}
      <div className="flex items-center justify-center py-6 border-b border-blue-900 bg-blue-900/20 backdrop-blur-sm">
        <img 
          src={logo} 
          alt="Logo" 
          className="w-28 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
        />
      </div>

      {/* Menu Section */}
      <nav className="flex-1 mt-4">
        {menuItems.map((item) => (
          <NavLink
  key={item.name}
  to={item.path}
  className={({ isActive }) =>
    `group relative flex items-center px-6 py-3 mb-1 transition-all duration-300 ease-in-out rounded-r-full
    ${
      isActive
        ? "text-blue-800 font-bold bg-white shadow-lg shadow-blue-500/20"
        : "text-white hover:bg-blue-900/60 hover:pl-7"
    }`
  }
>

  {/* FIXED INDICATOR BAR */}
  <span
    className="absolute left-0 top-0 h-full w-1 rounded-r-full transition-all duration-300"
    style={{
      backgroundColor:
        window.location.pathname === item.path ? "#3B82F6" : "transparent",
    }}
  />

  {item.name}
</NavLink>

        ))}
      </nav>
    </div>
  );
}
