import { useEffect, useState } from "react";
import axios from "axios";
import AddTeam from "../Teams/AddTeam";
import { Pencil, Trash2 } from "lucide-react";

export default function TeamMaster() {
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const loadTeams = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/teams/all");
      setTeams(res.data || []);
    } catch (err) {
      console.error("Load teams error:", err);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/teams/delete/${id}`);
      loadTeams();
    } catch (err) {
      console.error(err);
      alert("Failed to delete team");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Team Master</h2>
        <button
          className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-800"
          onClick={() => { setEditTeam(null); setShowForm(true); }}
        >
          + Add Team
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Logo</th>
              <th className="py-3">Team Name</th>
              <th className="py-3">Sport</th>
              <th className="py-3">Manager</th>
              <th className="py-3">Players</th>
              <th className="py-3 text-center">Status</th>
              <th className="py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No teams added yet.
                </td>
              </tr>
            ) : (
              teams.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3">
                    {t.logo ? (
                      <img src={t.logo} alt={t.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-50 text-blue-700 flex items-center justify-center rounded">
                        {t.name?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                    )}
                  </td>

                  <td className="py-3 font-medium">{t.name}</td>
                  <td>{t.sportName || "-"}</td>
                  <td>{t.manager?.name || "-"}</td>
                  
                  {/* ADJUSTMENT HERE: Use a flex container for wrapping chips */}
                  <td className="w-48">
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-hidden">
                      {(t.players || []).slice(0, 5).map(p => (
                        <span 
                          key={p.id} 
                          className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded block truncate max-w-full"
                          title={`${p.firstName} ${p.lastName}`} // Tooltip for full name
                        >
                          {p.firstName} {p.lastName}
                        </span>
                      ))}
                      {(t.players || []).length > 5 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{(t.players||[]).length - 5} more
                        </span>
                      )}
                    </div>
                  </td>
                  {/* END ADJUSTMENT */}
                  
                  <td className="text-center">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${t.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {t.status}
                    </span>
                  </td>

                  <td className="py-3 text-center flex items-center justify-center gap-3">
                    <Pencil
                      size={18}
                      className="text-yellow-600 cursor-pointer"
                      onClick={() => { setEditTeam(t); setShowForm(true); }}
                    />
                    <Trash2
                      size={18}
                      className="text-red-600 cursor-pointer"
                      onClick={() => deleteTeam(t.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AddTeam
          closeForm={() => { setShowForm(false); loadTeams(); }}
          editTeam={editTeam}
        />
      )}
    </div>
  );
}