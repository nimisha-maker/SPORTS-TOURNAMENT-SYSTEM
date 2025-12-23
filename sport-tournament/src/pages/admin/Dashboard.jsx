import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Users, Trophy, MapPin, Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const actionRoutes = {
    "Create New Tournament": "/admin/tournament",
    "Add Team": "/admin/team",
    "Add Player": "/admin/player",
    "Create Event": "/admin/event",
    "Add Venue": "/admin/venue"
  };

  useEffect(() => {
  let isMounted = true;
  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tournaments/stats/overview");
      const data = await response.json();
      if (isMounted) {
        setStats(data);
        setLoading(false);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };
  fetchData();
  return () => { isMounted = false; }; // Cleanup to prevent memory leaks
}, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F8FF]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Syncing Real-Time Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FF] p-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-6">Dashboard Overview</h2>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Players", value: stats.totalPlayers, icon: <Users /> },
          { title: "Total Teams", value: stats.totalTeams, icon: <Activity /> },
          { title: "Total Venues", value: stats.totalVenues, icon: <MapPin /> },
          { title: "Active Tournaments", value: stats.activeTournaments, icon: <Trophy /> },
        ].map((card) => (
          <div key={card.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm font-medium">{card.title}</p>
              <h3 className="text-3xl font-bold text-blue-700 mt-1">{card.value}</h3>
            </div>
            <div className="text-blue-100 p-3 bg-blue-50 rounded-lg">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* ACTIVE TOURNAMENTS (Real Data from Backend) */}
        <div className="col-span-2 bg-white rounded-xl p-6 border shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Ongoing & Recent Tournaments</h3>
          <div className="space-y-4">
            {stats.recentTournaments.map((t) => (
              <div 
                key={t.id} 
                className="p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition cursor-pointer flex justify-between items-center"
                onClick={() => navigate(`/admin/tournament`)}
              >
                <div>
                  <p className="font-semibold text-blue-900">{t.name}</p>
                  <p className="text-xs text-gray-600 mt-1">{t.venue} • {t.sportType}</p>
                </div>
                <span className="px-3 py-1 bg-white text-blue-700 text-xs font-bold rounded-full border border-blue-200 uppercase">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            {Object.keys(actionRoutes).map((action) => (
              <button
                key={action}
                onClick={() => navigate(actionRoutes[action])}
                className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-sm"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}