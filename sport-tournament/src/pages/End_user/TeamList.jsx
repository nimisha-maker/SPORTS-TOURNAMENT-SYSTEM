// src/pages/End_user/teams/TeamList.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function TeamList() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/teams/all")
      .then((res) => {
        setTeams(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("User TeamList error:", err);
        setError("Failed to load teams");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-2xl text-blue-900 font-medium">
          Loading teams...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-2xl text-red-600 font-medium">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-900 mb-4">
            Tournament Teams
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover all competing teams and explore their players
          </p>
        </div>

        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-2xl shadow-md p-12 max-w-md mx-auto">
              <p className="text-2xl text-blue-900 font-medium">
                No teams registered yet
              </p>
              <p className="text-gray-500 mt-3">
                Teams will appear here once added by the organizer
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200"
              >
                <div className="p-8">
                  <div className="flex items-center gap-6 mb-6">
                    {/* Team Avatar */}
                    <div className="shrink-0">
                      {team.logo ? (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-blue-900 text-white flex items-center justify-center text-3xl font-bold">
                          {team.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-blue-900">
                        {team.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {team.sportName || "Padel"}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Manager</span>
                      <span className="font-medium text-blue-900">
                        {team.manager?.name || "Not assigned"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Players</span>
                      <span className="font-bold text-blue-900 text-lg">
                        {team.players?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() =>
                      navigate("/user/players", {
                        state: {
                          players: team.players || [],
                          teamName: team.name,
                        },
                      })
                    }
                    className="w-full py-3 bg-blue-900 text-white font-semibold rounded-xl hover:bg-blue-800 transition"
                  >
                    View Players →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
