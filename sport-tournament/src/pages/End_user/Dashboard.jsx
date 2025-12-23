// src/pages/End_user/Dashboard.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Users, Trophy } from "lucide-react";

export default function UserDashboard() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tournaments/all")
      .then((res) => {
        setTournaments(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl font-bold text-blue-600">
        Loading Tournaments...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero */}
    

      {/* Tournament Cards */}
      <div className="max-w-7xl mx-auto px-6 py-16 -mt-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {tournaments.length === 0 ? (
            <p className="text-center text-xl text-gray-600 col-span-full">No tournaments available yet.</p>
          ) : (
            tournaments.map((t) => (
             <Link key={t.id} to={`/user/tournament/${t.id}`} className="block">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-4 transition-all duration-300">
                  {t.banner ? (
                    <img src={t.banner} alt={t.name} className="w-full h-56 object-cover" />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-t-3xl w-full h-56 flex items-center justify-center">
                      <Trophy className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{t.name || "Untitled Tournament"}</h3>
                    
                    <div className="space-y-3 text-gray-600">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <span>
                          {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {t.venue && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <span>{t.venue}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span>{t.events?.[0]?.participants?.length || 0} Teams</span>
                      </div>
                    </div>

                    <button className="mt-6 w-full bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition">
                      View Tournament →
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}