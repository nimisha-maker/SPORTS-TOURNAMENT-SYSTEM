import { useEffect, useState } from "react";
import axios from "axios";
// Added imports for the bulk upload feature
import { Upload, Download, Users } from "lucide-react"; 

const inputClass = "w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function AddTeam({ closeForm, refreshData, editTeam }) {
  const [form, setForm] = useState({
    name: "",
    sportId: "",
    sportName: "",
    players: [], // array of player objects {id, firstName, lastName}
    manager: { name: "", email: "", mobile: "" },
    status: "Active",
    logo: ""
  });

  const [allSports, setAllSports] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerSearch, setPlayerSearch] = useState("");
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [csvUploadMessage, setCsvUploadMessage] = useState(""); // New state for feedback

  useEffect(() => {
    // load sports & players from backend
    const loadMeta = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          axios.get("http://localhost:5000/api/sports/all"),
          axios.get("http://localhost:5000/api/players/all")
        ]);
        setAllSports(sRes.data || []);
        setAllPlayers(pRes.data || []);
      } catch (err) {
        console.error("meta load error:", err);
      }
    };
    loadMeta();
  }, []);

  useEffect(() => {
    if (editTeam) {
      setForm({
        name: editTeam.name || "",
        sportId: editTeam.sportId || "",
        sportName: editTeam.sportName || "",
        players: editTeam.players || [],
        manager: editTeam.manager || { name: "", email: "", mobile: "" },
        status: editTeam.status || "Active",
        logo: editTeam.logo || ""
      });
    }
  }, [editTeam]);

  useEffect(() => {
    if (!playerSearch) return setFilteredPlayers([]);
    const q = playerSearch.toLowerCase();
    setFilteredPlayers(allPlayers.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.mobile || "").includes(q)
    ));
  }, [playerSearch, allPlayers]);

  const addPlayerToTeam = (player) => {
    if ((form.players || []).some(p => p.id === player.id)) return;
    setForm(prev => ({ ...prev, players: [...(prev.players||[]), player] }));
    setPlayerSearch("");
    setFilteredPlayers([]);
  };

  const removePlayer = (id) => {
    setForm(prev => ({ ...prev, players: prev.players.filter(p => p.id !== id) }));
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) { alert("Only PNG/JPEG"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, logo: reader.result }));
    reader.readAsDataURL(file);
  };

  // ======================================================
  // NEW: DOWNLOAD TEAM PLAYER CSV TEMPLATE
  // ======================================================
  const downloadTeamPlayerCSV = () => {
    // Template for identifying existing players to add to the team
    const headers = [
      "email (Required: must match an existing player's email),mobile (Optional: used for backup match)"
    ];

    const blob = new Blob([headers.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "team_player_upload_template.csv";
    a.click();
    setCsvUploadMessage("");
  };

  // ======================================================
  // NEW: BULK CSV UPLOAD (Add Existing Players to Current Team)
  // ======================================================
  const handleTeamPlayerCSVUpload = async (event) => {
    const file = event.target.files[0];
    setCsvUploadMessage("");
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvUploadMessage("Please upload a valid CSV file!");
      return;
    }

    const text = await file.text();
    const rows = text.split("\n").slice(1).filter(r => r.trim() !== ""); // skip header and empty lines

    let addedCount = 0;
    let failedCount = 0;
    let newPlayersToAdd = [...(form.players || [])];

    rows.forEach((row) => {
      const cols = row.split(",").map(c => c.trim());
      const email = cols[0] || '';
      const mobile = cols[1] || '';

      // Find the player in the list of all existing players
      const existingPlayer = allPlayers.find(p => 
        (email && p.email?.toLowerCase() === email.toLowerCase()) || 
        (mobile && p.mobile === mobile)
      );

      if (existingPlayer) {
        // Check if player is already in the team
        if (!newPlayersToAdd.some(p => p.id === existingPlayer.id)) {
          // Add player data required by the team state: {id, firstName, lastName}
          newPlayersToAdd.push({
            id: existingPlayer.id,
            firstName: existingPlayer.firstName,
            lastName: existingPlayer.lastName,
          });
          addedCount++;
        }
      } else {
        failedCount++;
      }
    });

    setForm(prev => ({ ...prev, players: newPlayersToAdd }));

    if (addedCount > 0) {
      setCsvUploadMessage(`Successfully added ${addedCount} new player(s) to the team.`);
    } else if (failedCount > 0) {
      setCsvUploadMessage(`No players were added. ${failedCount} row(s) failed to match an existing player.`);
    } else {
      setCsvUploadMessage("All players in the CSV were either already on this team or could not be found.");
    }

    // Reset file input to allow re-uploading the same file
    event.target.value = null; 
  };
  
  // ======================================================
  // SAVE TEAM
  // ======================================================
  const saveTeam = async () => {
    if (!form.name || !form.sportId) return alert("Team name & sport required");
    try {
      if (editTeam) {
        await axios.post(`http://localhost:5000/api/teams/edit/${editTeam.id}`, form);
      } else {
        await axios.post("http://localhost:5000/api/teams/add", form);
      }
      refreshData && refreshData();
      closeForm();
    } catch (err) {
      console.error("save team error:", err);
      alert("Failed to save team");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[95%] max-w-3xl p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{editTeam ? "Edit Team" : "Add Team"}</h2>
          <button onClick={closeForm}>❌</button>
        </div>

        <div className="grid grid-cols-2 gap-6">

          <div>
            <label className="font-semibold block mb-1">Team Name</label>
            <input className={inputClass} value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Team Name" />
          </div>

          <div>
            <label className="font-semibold block mb-1">Sport</label>
            <select className={inputClass} value={form.sportId} onChange={(e) => {
              const s = allSports.find(x => String(x.id) === String(e.target.value));
              setForm(prev => ({ ...prev, sportId: e.target.value, sportName: s?.name || "" }));
            }}>
              <option value="">Select sport</option>
              {allSports.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Manager Info */}
          <div>
            <label className="font-semibold block mb-1">Manager Name</label>
            <input className={inputClass} value={form.manager.name} onChange={(e) => setForm({...form, manager: {...form.manager, name: e.target.value}})} placeholder="Manager Name" />
          </div>

          <div>
            <label className="font-semibold block mb-1">Manager Email</label>
            <input className={inputClass} value={form.manager.email} onChange={(e) => setForm({...form, manager: {...form.manager, email: e.target.value}})} placeholder="Manager Email" />
          </div>

          <div>
            <label className="font-semibold block mb-1">Manager Mobile</label>
            <input className={inputClass} value={form.manager.mobile} onChange={(e) => setForm({...form, manager: {...form.manager, mobile: e.target.value}})} placeholder="Manager Mobile" />
          </div>

          <div>
            <label className="font-semibold block mb-1">Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          
          {/* NEW: BULK UPLOAD PLAYERS TO TEAM SECTION */}
          <div className="col-span-2 p-4 border rounded-xl bg-indigo-50/70 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <Users size={20} className="mr-2"/> Bulk Add Existing Players to Team
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Download the template and upload a CSV file with player emails to quickly add them to this team's roster.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={downloadTeamPlayerCSV}
                className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition shadow text-sm flex-1"
              >
                <Download size={18} className="mr-2"/> Download Player CSV Template
              </button>

              <label 
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition shadow text-sm flex-1"
              >
                <Upload size={18} className="mr-2"/> Upload Player CSV to Team
                <input type="file" accept=".csv" className="hidden" onChange={handleTeamPlayerCSVUpload} />
              </label>
            </div>

            {csvUploadMessage && (
              <p className={`text-sm mt-3 font-medium ${csvUploadMessage.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>
                  {csvUploadMessage}
              </p>
            )}
          </div>
          {/* END BULK UPLOAD SECTION */}

          {/* Player selector */}
          <div className="col-span-2">
            <label className="font-semibold block mb-1">Players</label>
            <div className="mb-2">
              <input
                className="w-full px-4 py-2 border border-blue-300 rounded"
                placeholder="Search players by name / email / mobile"
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
              />
            </div>

            {filteredPlayers.length > 0 && (
              <div className="mb-2 border rounded bg-white max-h-48 overflow-y-auto p-2">
                {filteredPlayers.map(p => (
                  <div key={p.id} className="p-2 hover:bg-gray-50 cursor-pointer" onClick={() => addPlayerToTeam(p)}>
                    <div className="flex justify-between">
                      <div>{p.firstName} {p.lastName} <span className="text-xs text-gray-500">({p.email||p.mobile})</span></div>
                      <div className="text-xs text-blue-600">Add</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {(form.players || []).map(p => (
                <div key={p.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded flex items-center gap-2">
                  <span>{p.firstName} {p.lastName}</span>
                  <button className="text-red-500" onClick={() => removePlayer(p.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* Logo upload */}
          <div className="col-span-2">
            <label className="font-semibold block mb-1">Team Logo (PNG/JPG)</label>
            <div className="border-2 border-dashed border-blue-300 p-4 rounded-lg flex items-center gap-6">
              <div>
                <input id="teamLogo" type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogo} />
                <label htmlFor="teamLogo" className="cursor-pointer px-4 py-2 bg-blue-700 text-white rounded">Choose File</label>
              </div>

              {form.logo ? (
                <img src={form.logo} alt="logo" className="w-20 h-20 rounded object-cover border" />
              ) : (
                <div className="text-sm text-gray-500">No logo selected</div>
              )}
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 border rounded" onClick={closeForm}>Cancel</button>
          <button className="px-6 py-3 bg-blue-700 text-white rounded" onClick={saveTeam}>Save Team</button>
        </div>

      </div>
    </div>
  );
}