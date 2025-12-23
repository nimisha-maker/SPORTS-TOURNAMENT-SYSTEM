import { useEffect, useState } from "react";
import axios from "axios";
import AddSport from "../sports/Addsport";
import { Pencil, Trash2 } from "lucide-react";

export default function SportsMaster() {
  const [sports, setSports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editSport, setEditSport] = useState(null);

  const loadSports = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sports/all");
      setSports(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSports();
  }, []);

  const deleteSport = async (id) => {
    if (!window.confirm("Delete this sport?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/sports/delete/${id}`);
      loadSports();
    } catch (err) {
      console.error(err);
      alert("Failed to delete sport");
    }
  };

  return (
    <div className="p-6">

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Sports Master</h2>

        <button
          className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold 
                     hover:bg-blue-800 transition"
          onClick={() => { setEditSport(null); setShowForm(true); }}
        >
          + Add Sport
        </button>
      </div>

      {/* SPORTS GRID */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          {sports.length === 0 ? (
            <div className="col-span-3 text-center p-6 text-gray-500 border rounded bg-blue-50">
              No sports added yet.
            </div>
          ) : (
            sports.map((s) => (
              <div
                key={s.id}
                className="group p-5 rounded-xl border bg-blue-50/60 
                           shadow-sm hover:shadow-xl transition-all 
                           hover:bg-blue-100/70 cursor-pointer"
              >
                <div className="flex items-center gap-4">

                  {/* SPORT ICON */}
                  <div className="w-16 h-16 rounded-xl bg-blue-200 flex items-center justify-center shadow 
                                  group-hover:scale-105 transition">
                    {s.icon ? (
                      <img src={s.icon} alt={s.name} className="w-16 h-16 object-cover rounded-xl" />
                    ) : (
                      <span className="text-2xl font-semibold text-blue-700">
                        {s.name?.charAt(0)?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* SPORT NAME + ACTIONS */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">

                      {/* Title */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {s.name}
                        </h3>

                        <p className="text-sm text-gray-600 mt-1">
                          {s.scoringType} •{" "}
                          {s.sets
                            ? `${s.sets} sets`
                            : s.overs
                            ? `${s.overs} overs`
                            : ""}
                        </p>
                      </div>

                      {/* ACTION BUTTONS */}
                      <div className="flex items-center gap-3">
                        <Pencil
                          size={18}
                          className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                          onClick={() => { setEditSport(s); setShowForm(true); }}
                        />
                        <Trash2
                          size={18}
                          className="text-red-600 cursor-pointer hover:text-red-700"
                          onClick={() => deleteSport(s.id)}
                        />
                      </div>
                    </div>

                    {/* TIE BREAK TAGS */}
                    {s.tieBreak?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.tieBreak.map((rule, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-md"
                          >
                            {rule}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <AddSport
          closeForm={() => { setShowForm(false); loadSports(); }}
          refreshData={loadSports}
          editSport={editSport}
        />
      )}
    </div>
  );
}
