import { useEffect, useState } from "react";
import axios from "axios";
import AddPlayer from "../Players/Addplayer";
import { Pencil, Trash2 } from "lucide-react";

export default function PlayerMaster() {
  const [players, setPlayers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);

  const loadPlayers = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/players/all");
      setPlayers(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  const deletePlayer = async (id) => {
    if (!window.confirm("Delete this player?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/players/delete/${id}`);
      loadPlayers();
    } catch (err) {
      alert("Failed to delete player");
    }
  };

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Player Master</h2>

        <button
          className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          onClick={() => { setEditPlayer(null); setShowForm(true); }}
        >
          + Add Player
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow-lg border overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Photo</th>
              <th className="py-3">Name</th>
              <th className="py-3">Gender</th>
              <th className="py-3">DOB</th>
              <th className="py-3">Email</th>
              <th className="py-3">Mobile</th>
              <th className="py-3">Status</th>
              <th className="py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No players added yet.
                </td>
              </tr>
            ) : (
              players.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3">
                    <img
                      src={p.photo || "/default-player.png"}
                      className="w-12 h-12 object-cover rounded-full border"
                    />
                  </td>

                  <td className="font-medium">{p.firstName} {p.lastName}</td>
                  <td>{p.gender}</td>
                  <td>{p.dob}</td>
                  <td>{p.email}</td>
                  <td>{p.mobile}</td>

                  <td>
                    <span className={`px-3 py-1 rounded text-xs font-semibold 
                      ${p.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="text-center flex items-center justify-center gap-3 py-3">
                    <Pencil
                      size={18}
                      className="text-yellow-600 cursor-pointer"
                      onClick={() => { setEditPlayer(p); setShowForm(true); }}
                    />

                    <Trash2
                      size={18}
                      className="text-red-600 cursor-pointer"
                      onClick={() => deletePlayer(p.id)}
                    />
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <AddPlayer
          closeForm={() => setShowForm(false)}
          refreshData={loadPlayers}
          editPlayer={editPlayer}
        />
      )}
    </div>
  );
}
