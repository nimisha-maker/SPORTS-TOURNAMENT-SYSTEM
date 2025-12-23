// src/pages/admin/tournaments/CreateTournament.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Plus, GripVertical, Shuffle } from "lucide-react"; 

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";


// Helper to format participant for fixture pairing
const participantForPairing = (p) => {
  if (!p) return { id: null, name: "" }; 

  // double team (group)
  if (p.players && Array.isArray(p.players)) {
    // Display only player names for doubles
    const playerNames = p.players.map(x => x.name || `${x.firstName || ""} ${x.lastName || ""}`).filter(Boolean).join(" / ");
    return { id: p.id, name: playerNames || "Double Team", raw: p };
  }
  // team or player
  const name = p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
  return { id: p.id || null, name: name || p.teamName || "", raw: p }; 
};

// NEW Helper: Extracts unique players from all teams in an 'Internal Group' event
function allInternalPlayersForFixtureSelect(ev, teams) {
    if (ev.type !== "Internal Group" || (ev.participants || []).length === 0) return [];

    let allPlayers = [];
    const uniquePlayerIds = new Set();
    
    (ev.participants || []).filter(p => p).forEach(teamParticipant => {
        // Find the full team object from the global teams list
        const team = teams.find(t => String(t.id) === String(teamParticipant.id));
        if (team && Array.isArray(team.players)) {
            team.players.forEach(p => {
                if (!p || !p.id) return; 

                const playerId = String(p.id);
                if (!uniquePlayerIds.has(playerId)) {
                    allPlayers.push({
                        id: p.id,
                        // Use raw player object format for pairing
                        name: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(), 
                        firstName: p.firstName,
                        lastName: p.lastName
                    });
                    uniquePlayerIds.add(playerId);
                }
            });
        }
    });

    return allPlayers;
}

// NEW Function: Determines the list of selectable participants for the fixture select dropdown
const getFixtureSelectParticipants = (ev, teams) => {
    let rawParticipants = [];
    if (ev.type === "Internal Group") {
        // Use the list of unique players from the selected source teams
        rawParticipants = allInternalPlayersForFixtureSelect(ev, teams);
    } else {
        // Use the event's direct participants list for Team/Individual/Double
        rawParticipants = (ev.participants || []).filter(p => p && p.id);
    }
    
    // Transform raw participants into standardized fixture objects
    return rawParticipants
        .map(participantForPairing)
        // Ensure no null IDs or empty names after transformation, and exclude BYE for selection
        .filter(p => p && p.id !== null && p.name && p.name.trim() !== 'BYE');
};


// Utility to get participant value for select element
const getParticipantValue = (part) => {
  return part?.id ? `part::${part.id}` : '';
};


// SYNCHRONIZATION POINT 1: Prop names now match TournamentList.jsx (onClose, api, initialData)
export default function CreateTournament({ onClose, api, initialData }) {
  // Use initialData instead of editTournament
  const initial = initialData
    ? { ...initialData }
    : {
        id: null,
        name: "",
        venue: "",
        startDate: "",
        endDate: "",
        description: "",
        banner: "",
        status: "Draft",
        sportType: "",
        eventMaster: "",
        eventSubType: "",
        events: [],
      };

  const [tournament, setTournament] = useState(initial);
  const [venues, setVenues] = useState([]);
  const [sports, setSports] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [eventMasterList, setEventMasterList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLookups();
    // Use initialData instead of editTournament
    if (initialData) {
        const cleanedEvents = (initialData.events || []).map(ev => ({
            ...ev,
            participants: (ev.participants || []).filter(p => p && p.id) 
        }));
        setTournament({ ...initialData, events: cleanedEvents });
    }
    // eslint-disable-next-line
  }, [initialData]);

  const loadLookups = async () => {
    try {
      // NOTE: These lookups are kept as absolute paths as they reference external services 
      // not covered by the TournamentList's `useApi` hook.
      const [vRes, sRes, tRes, pRes, eRes] = await Promise.all([
        axios.get("http://localhost:5000/api/venues/all").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/sports/all").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/teams/all").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/players/all").catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/events/all").catch(() => ({ data: [] })),
      ]);

      setVenues(vRes.data || []);
      setSports(sRes.data || []);
      setTeams(tRes.data || []);
      setPlayers(pRes.data || []);

      const evs = (eRes.data || []).map((ev) => ({
        ...ev,
        eventName: ev.eventName || ev.name || ev.label || "",
      }));
      setEventMasterList(evs);
    } catch (err) {
      console.error("Lookup load failed", err);
    }
  };

  // ---------- Events ----------
  const addEvent = () => {
    const ev = {
      id: `ev-${Date.now()}`,
      label: tournament.eventSubType || tournament.eventMaster || "",
      sportName: tournament.sportType || "",
      type: "Team", // Team | Individual | Double | Internal Group (NEW)
      format: "Round Robin", // Round Robin | Knockout | Custom
      participants: [], // teams, players, or double groups
      fixtures: [],
      manual: false,
      showAddPlayerForm: false,
    };
    setTournament((prev) => ({ ...prev, events: [...(prev.events || []), ev] }));
  };

  const updateEvent = (index, data) => {
    const evs = [...(tournament.events || [])];
    evs[index] = { ...evs[index], ...data };
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  const removeEvent = (index) => {
    const evs = [...(tournament.events || [])];
    evs.splice(index, 1);
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  // ---------- Participants ----------
  // participant can be: { id, name } (team or player) OR for doubles: { id, teamName, players: [...] }
  const addParticipantToEvent = (evIndex, participant, kind = "team") => {
    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[evIndex] || {}) };
    ev.participants = ev.participants || [];

    // NEW RESTRICTION: Internal Group must be teams
    if (ev.type === "Internal Group" && kind === "player") {
        return alert("Only teams can be added to an 'Internal Group' event. The system will use the players within those teams to create matches.");
    }
    
    // Double handling: if type === "Double" and adding player -> group them in team objects
    if (ev.type === "Double" && kind === "player") {
      let last = ev.participants.length ? ev.participants.filter(p => p).slice(-1)[0] : null; 
      
      // Check if last double team exists and needs another player (max 2)
      if (!last || !last.players || last.players.length >= 2 || typeof last.teamName === "undefined") {
        last = { 
          id: `double-${Date.now()}-${Math.random()}`, 
          teamName: `Double Team ${ev.participants.filter(p => p.players).length + 1}`, 
          players: [] 
        };
        ev.participants.push(last);
      }
      
      // Check if the player is already in this double team (or any other double team in the event)
      const isPlayerAlreadyInDoubles = ev.participants.some(p => p.players && p.players.some(pp => String(pp.id) === String(participant.id)));
      if (last.players.length < 2 && !isPlayerAlreadyInDoubles) {
        last.players.push(participant);
      }
    } else {
      // Team, Individual, or Internal Group (Team) - avoid duplicates by id
      const exists = ev.participants.some((p) => String(p.id) === String(participant.id));
      if (!exists) ev.participants.push(participant);
    }

    evs[evIndex] = ev;
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  const removeParticipantFromEvent = (evIndex, participantId) => {
    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[evIndex] || {}) };
    let currentParticipants = (ev.participants || []).filter(p => p); 

    if (ev.type === "Double") {
      // For Doubles: remove the player from all double teams
      currentParticipants = currentParticipants.map(p => {
        if (p.players && Array.isArray(p.players)) {
          p.players = p.players.filter(pp => String(pp.id) !== String(participantId));
        }
        return p;
      }).filter(p => !p.players || p.players.length > 0);

      // Remove the double team itself if participantId is the team ID (for the chip removal)
      currentParticipants = currentParticipants.filter(p => String(p.id) !== String(participantId));

    } else {
      // Team, Individual, or Internal Group: remove by ID
      currentParticipants = currentParticipants.filter((p) => p && String(p.id) !== String(participantId));
    }
    
    ev.participants = currentParticipants;
    evs[evIndex] = ev;
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  // show/hide add player inline form
  const toggleAddPlayerForm = (evIndex, show) => {
    const evs = [...(tournament.events || [])];
    evs[evIndex] = { ...evs[evIndex], showAddPlayerForm: show };
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  const addPlayerInline = (evIndex, fullName, email) => {
    const ev = (tournament.events || [])[evIndex];
    if (ev.type === "Team" || ev.type === "Internal Group") return alert(`Cannot add individual players to a ${ev.type} event. Add a Team instead.`);
    
    if (!fullName) return alert("Enter player name");
    const id = Date.now();
    const parts = fullName.trim().split(" ");
    const firstName = parts.shift();
    const lastName = parts.join(" ");
    const newPlayer = { id, firstName, lastName, email: email || "", name: `${firstName} ${lastName}`.trim() };
    
    // add to global players
    setPlayers((prev) => [newPlayer, ...(prev || [])]);
    // add as participant (player)
    addParticipantToEvent(evIndex, { id: newPlayer.id, name: newPlayer.name, firstName: newPlayer.firstName, lastName: newPlayer.lastName }, "player");
    toggleAddPlayerForm(evIndex, false);
  };


  const generateRoundRobin = (parts) => {
    const p = parts.map(participantForPairing);
    // Filter out participants where names could not be resolved (e.g. empty double team) or BYE
    const validParticipants = p.filter(part => part.name && part.name !== 'Double Team' && part.name !== 'BYE'); 

    if (validParticipants.length < 2) return [];
    // ensure even by adding bye
    const arr = validParticipants.slice();
    if (arr.length % 2 === 1) arr.push({ id: `bye-${Date.now()}`, name: "BYE" });
    const n = arr.length;
    const rounds = [];
    for (let round = 0; round < n - 1; round++) {
      for (let i = 0; i < n / 2; i++) {
        const a = arr[i];
        const b = arr[n - 1 - i];
        if (!a || !b) continue;
        if (a.name === "BYE" && b.name === "BYE") continue; // Should not happen with current logic, but safeguard
        
        rounds.push({
          id: `m-${Date.now()}-${Math.random()}`,
          round: round + 1,
          teamA: a,
          teamB: b,
          scheduledAt: null,
          court: "",
          status: "Scheduled",
          score: null,
        });
      }
      // rotate (circle method)
      const fixed = arr[0];
      const rest = arr.slice(1);
      rest.unshift(rest.pop());
      arr.length = 0;
      arr.push(fixed, ...rest);
    }
    return rounds;
  };

  const generateKnockout = (parts) => {
    const p = parts.map(participantForPairing);
    // Filter out participants where names could not be resolved (e.g. empty double team)
    const validParticipants = p.filter(part => part.name && part.name !== 'Double Team' && part.name !== 'BYE'); 

    if (validParticipants.length < 2) return [];
    const arr = validParticipants.slice().sort(() => Math.random() - 0.5);
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(2, arr.length))));
    while (arr.length < nextPow2) arr.push({ id: `bye-${Date.now()}-${Math.random()}`, name: "BYE" });
    const fixtures = [];
    for (let i = 0; i < arr.length; i += 2) {
      const a = arr[i];
      const b = arr[i + 1];
      if (!a || !b) continue;
      
      fixtures.push({
        id: `m-${Date.now()}-${Math.random()}`,
        round: 1,
        teamA: a,
        teamB: b,
        scheduledAt: null,
        court: "",
        status: "Scheduled",
        score: null,
      });
    }
    return fixtures;
  };
  
  const generateForEvent = (evIndex) => {
    const ev = (tournament.events || [])[evIndex];
    if (!ev) return alert("Event not found");
    const parts = ev.participants || [];

    // --- NEW: Internal Group Logic ---
    if (ev.type === "Internal Group") {
        if (parts.length < 1) return alert("Internal Group event requires at least one team participant.");
        
        // Get the list of players to use for fixture generation
        const allInternalPlayers = allInternalPlayersForFixtureSelect(ev, teams);
        
        if (allInternalPlayers.length < 2) return alert(`The selected teams must collectively have at least 2 unique players defined to run internal matches. Found ${allInternalPlayers.length} unique players.`);

        if (ev.format === "Round Robin") {
            const fixtures = generateRoundRobin(allInternalPlayers); 
            // Internal Group is designed for one-off matches between players of a larger group
            updateEvent(evIndex, { fixtures, manual: false });
            return;
        }
        return alert(`Internal Group format ${ev.format} is currently only supported with Round Robin for auto-generation.`);
    }
    // --- END Internal Group Logic ---
    
    // Default logic for Team, Individual, Double
    if (parts.length < 2) return alert("Need at least 2 participants");
    let fixtures = [];
    
    // Auto Generate mode logic
    if (ev.format === "Round Robin") fixtures = generateRoundRobin(parts);
    else if (ev.format === "Knockout") fixtures = generateKnockout(parts);
    else {
      // If format is 'Custom', but user hits Auto Generate
      alert("Custom format selected — add fixtures manually or switch format.");
      return;
    }
    
    // Set manual to false when auto-generating
    updateEvent(evIndex, { fixtures, manual: false });
  };

  // manual fixture add
  const addManualFixture = (evIndex) => {
    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[evIndex] || {}) };
    ev.fixtures = ev.fixtures || [];
    
    // Get the list of selectable participants based on event type
    const selectableParticipants = getFixtureSelectParticipants(ev, teams);
    
    // Use first two participants if available, otherwise use empty objects
    const teamA = selectableParticipants?.[0] || { id: null, name: "" };
    const teamB = selectableParticipants?.[1] || { id: null, name: "" };

    // FIX from previous step: correct key name from teamA to teamB
    ev.fixtures.push({ id: `m-${Date.now()}`, round: 1, teamA, teamB, scheduledAt: null, court: "", status: "Scheduled", score: null });
    
    // Set manual mode to true when adding manually
    updateEvent(evIndex, { manual: true, fixtures: ev.fixtures });
  };

  const updateFixture = (evIndex, fixtureId, data) => {
    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[evIndex] || {}) };
    ev.fixtures = (ev.fixtures || []).map((f) => (f.id === fixtureId ? { ...f, ...data } : f));
    evs[evIndex] = ev;
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  const deleteFixture = (evIndex, fixtureId) => {
    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[evIndex] || {}) };
    ev.fixtures = (ev.fixtures || []).filter((f) => f.id !== fixtureId);
    evs[evIndex] = ev;
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  // ---------- Drag & drop handler (fixtures) ----------
  // react-beautiful-dnd onDragEnd
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceId = result.source.droppableId; // format "ev-<index>"
    const destId = result.destination.droppableId;
    const sourceIndex = Number(sourceId.split("-")[1]);
    const destIndex = Number(destId.split("-")[1]);

    // only support same event re-order for now
    if (sourceIndex !== destIndex) return;

    const evs = [...(tournament.events || [])];
    const ev = { ...(evs[sourceIndex] || {}) };
    const items = Array.from(ev.fixtures || []);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    ev.fixtures = items;
    evs[sourceIndex] = ev;
    setTournament((prev) => ({ ...prev, events: evs }));
  };

  // ---------- Save ----------
  const saveTournament = async (publish = false) => {
    // SYNCHRONIZATION POINT 2: Use the `api` prop passed from TournamentList.jsx
    // FIX 1: Check for the existence of 'add' or 'edit' methods on the API object
    if (!api || (typeof api.add !== 'function' && typeof api.edit !== 'function')) {
      alert("API is not available. Cannot save. Please ensure the 'api' prop is correctly passed from TournamentList.jsx.");
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...tournament,
        status: publish ? "Published" : tournament.status || "Draft",
      };

      // FIX 2: Use api.edit for existing tournament (with ID) or api.add for a new one.
      if (tournament.id) {
          // Editing existing tournament
          await api.edit(tournament.id, payload);
      } else {
          // Adding new tournament
          await api.add(payload);
      }
      
      if (publish) {
        // SYNCHRONIZATION POINT 3: Call onClose(true) to refresh the parent list and close the modal.
        onClose(true);
        setLoading(false);
        return alert("Tournament published");
      }

      // Draft save: keep the form open and alert success.
      alert("Saved successfully (Draft)");
      
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed!");
    } finally {
      setLoading(false);
    }
  };

  const onBanner = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => setTournament((prev) => ({ ...prev, banner: r.result }));
    r.readAsDataURL(f);
  };


  // ---------- UI ----------
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-6">
      <div className="bg-white w-[95%] max-w-7xl rounded-2xl shadow-2xl overflow-auto max-h-[95vh] border border-slate-200">
        <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{tournament.id ? "Edit Tournament" : "Create Tournament"}</h2>
            <p className="text-sm opacity-90">Create events, add participants and generate fixtures</p>
          </div>
          {/* SYNCHRONIZATION POINT 4: Close button uses onClose(false) */}
          <button onClick={() => onClose(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg">
            <X className="text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-700 font-medium">Tournament Name</label>
              <input className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.name} onChange={(e) => setTournament({ ...tournament, name: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Event Sub-Type (Label)</label>
              <input className="w-full p-3 border rounded mt-1 shadow-sm" placeholder="e.g. Men's Doubles" value={tournament.eventSubType || ""} onChange={(e) => setTournament({ ...tournament, eventSubType: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Sport (Main)</label>
              <select className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.sportType} onChange={(e) => setTournament({ ...tournament, sportType: e.target.value })}>
                <option value="">Select sport</option>
                {sports.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Event Name (Master)</label>
              <select className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.eventMaster || ""} onChange={(e) => setTournament(prev => ({ ...prev, eventMaster: e.target.value }))}>
                <option value="">Select Event Type</option>
                {eventMasterList.map((ev) => (<option key={ev.id} value={ev.eventName || ev.name}>{ev.eventName || ev.name}</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Venue</label>
              <select className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.venue} onChange={(e) => setTournament({ ...tournament, venue: e.target.value })}>
                <option value="">Select venue</option>
                {venues.map((v) => (<option key={v.id} value={v.venueName || v.name || v.id}>{v.venueName || v.name || v.id}</option>))}
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Start Date</label>
              <input type="date" className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.startDate} onChange={(e) => setTournament({ ...tournament, startDate: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">End Date</label>
              <input type="date" className="w-full p-3 border rounded mt-1 shadow-sm" value={tournament.endDate} onChange={(e) => setTournament({ ...tournament, endDate: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-slate-700 font-medium">Banner</label>
              <input type="file" accept="image/*" className="w-full p-2 mt-1 border rounded shadow-sm" onChange={onBanner} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-slate-700 font-medium">Description</label>
            <textarea className="w-full p-3 border rounded mt-1 shadow-sm" rows={3} value={tournament.description} onChange={(e) => setTournament({ ...tournament, description: e.target.value })} />
          </div>

          {/* Events & Fixtures */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-slate-800">Fixtures & Events</h3>
              <button onClick={addEvent} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 flex items-center gap-2"><Plus size={18} /> Add Event/Fixture Group</button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="space-y-4">
                {(tournament.events || []).map((ev, idx) => {
                    // Pre-calculate selectable participants for dropdowns inside this iteration
                    const fixtureSelectParticipants = getFixtureSelectParticipants(ev, teams);

                    return (
                    <div key={ev.id} className="bg-white border rounded-xl p-4 shadow-md relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t-xl"></div>

                        {/* Event Details/Type */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <input className="p-2 border rounded shadow-sm" placeholder="Event Label (e.g. Group A)" value={ev.label || ""} onChange={(e) => updateEvent(idx, { label: e.target.value })} />
                        <select className="p-2 border rounded shadow-sm" value={ev.format || "Round Robin"} onChange={(e) => updateEvent(idx, { format: e.target.value })}>
                            <option>Round Robin</option>
                            <option>Knockout</option>
                            <option>Custom</option>
                        </select>
                        <select className="p-2 border rounded shadow-sm" value={ev.type || "Team"} onChange={(e) => updateEvent(idx, { type: e.target.value, participants: [] })}> 
                            <option value="Team">Team (Team vs Team)</option>
                            <option value="Individual">Individual (Player vs Player)</option>
                            <option value="Double">Double (2 Players vs 2 Players)</option>
                            <option value="Internal Group">Internal Group (Players within Teams)</option>
                        </select>
                        </div>

                        {/* participant selector */}
                        <div className="mt-3 flex gap-2 items-center">
                        <select className="p-2 border rounded flex-1" onChange={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const [kind, id] = val.split("::");
                            if (kind === "team") {
                            const t = teams.find(tt => String(tt.id) === String(id));
                            if (t) addParticipantToEvent(idx, { id: t.id, name: t.name }, "team");
                            } else if (kind === "player") {
                            const p = players.find(pp => String(pp.id) === String(id));
                            if (p) addParticipantToEvent(idx, { id: p.id, name: `${p.firstName || ""} ${p.lastName || ""}`.trim(), firstName: p.firstName, lastName: p.lastName }, "player");
                            }
                            e.target.value = "";
                        }} value="">
                            <option value="">Add existing participant (team/player)…</option>
                            
                            <optgroup label="Teams">
                            {/* Show Teams if type is Team or Internal Group, and not already added */}
                            {(ev.type === "Team" || ev.type === "Internal Group") && 
                            (teams || []).filter(tm => !ev.participants.some(p => String(p.id) === String(tm.id))).map(tm => 
                                <option key={`team-${tm.id}`} value={`team::${tm.id}`}>{tm.name}</option>
                            )}
                            </optgroup>
                            
                            <optgroup label="Players">
                            {/* Show Players if type is Individual or Double, and not already added */}
                            {(ev.type === "Individual" || ev.type === "Double") &&
                            (players || []).filter(pl => 
                                !ev.participants.some(p => String(p.id) === String(pl.id)) && 
                                !ev.participants.some(p => p.players && p.players.some(pp => String(pp.id) === String(pl.id))) 
                            ).map(pl => 
                                <option key={`player-${pl.id}`} value={`player::${pl.id}`}>{pl.firstName} {pl.lastName}</option>
                            )}
                            </optgroup>
                        </select>

                        {/* New Team button (for Team and Internal Group) */}
                        {(ev.type === "Team" || ev.type === "Internal Group") && (
                            <button className="px-3 py-2 bg-green-600 text-white rounded whitespace-nowrap hover:bg-green-700" onClick={() => {
                                const nt = { id: Date.now(), name: `Team ${Date.now()}` };
                                setTeams(prev => [nt, ...prev]);
                                addParticipantToEvent(idx, nt, "team");
                            }}>+ New Team</button>
                        )}
                        
                        {/* New Player button (for Individual and Double) */}
                        {(ev.type === "Individual" || ev.type === "Double") && (
                            <button className="px-3 py-2 border rounded whitespace-nowrap hover:bg-slate-100" onClick={() => toggleAddPlayerForm(idx, !(ev.showAddPlayerForm))}>{ev.showAddPlayerForm ? "Cancel Add Player" : "+ Add Player"}</button>
                        )}
                        </div>

                        {/* inline add player */}
                        {ev.showAddPlayerForm && (
                        <AddPlayerForm onAdd={(name, email) => addPlayerInline(idx, name, email)} />
                        )}

                        {/* participants chips */}
                        <div className="mt-3 flex gap-2 flex-wrap min-h-[30px] border-b pb-3">
                        {(ev.participants || []).map((p) => {
                            // Double Team Chip (Players' names displayed)
                            if (p.players && Array.isArray(p.players)) {
                            const playerNames = p.players.map(x => x.name || `${x.firstName || ""} ${x.lastName || ""}`.trim()).filter(Boolean);
                            if (playerNames.length === 0) return null;

                            return (
                                <div key={p.id} className="px-3 py-1 bg-indigo-100 border border-indigo-300 rounded-full flex items-center gap-2">
                                <div className="text-sm font-medium text-indigo-800">{playerNames.join(" / ")}</div>
                                <button className="text-rose-500 hover:text-rose-700" onClick={() => {
                                    p.players.forEach(pl => removeParticipantFromEvent(idx, pl.id)); 
                                    removeParticipantFromEvent(idx, p.id); 
                                }}>
                                    <X size={14} />
                                </button>
                                </div>
                            );
                            }
                            
                            // Individual/Team/Internal Group Chip (Name displayed)
                            const participantId = p.id;
                            const participantName = p.name || p.firstName || p.teamName;
                            const isInternalGroup = ev.type === 'Internal Group';
                            const chipStyle = isInternalGroup ? 'bg-purple-100 border-purple-300 text-purple-800' : 'bg-blue-100 border-blue-300 text-blue-800';

                            return (
                            <div key={p.id} className={`px-3 py-1 ${chipStyle} rounded-full flex items-center gap-2`}>
                                <div className="text-sm font-medium">{participantName} {isInternalGroup && '(Source)'}</div>
                                <button className="text-rose-500 hover:text-rose-700" onClick={() => removeParticipantFromEvent(idx, participantId)}>
                                    <X size={14} />
                                </button>
                            </div>
                            );
                        })}
                        {(ev.participants || []).filter(p => !p.players || p.players.length > 0).length === 0 && 
                            <div className="text-xs text-slate-400 p-1">No participants yet</div>
                        }
                        </div>

                        {/* action buttons */}
                        <div className="mt-3 flex flex-wrap gap-2 items-center pt-3">
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 flex items-center gap-2" onClick={() => generateForEvent(idx)}><Shuffle size={16}/> Auto Generate Fixtures</button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700" onClick={() => addManualFixture(idx)}>+ Add Manual Match</button>
                        <button className="px-4 py-2 border rounded shadow hover:bg-slate-100" onClick={() => updateEvent(idx, { manual: !ev.manual })}>{ev.manual ? "Switch to Auto Mode" : "Switch to Manual Mode"}</button>
                        <button className="px-4 py-2 border text-red-600 rounded shadow hover:bg-red-50" onClick={() => removeEvent(idx)}>Remove Event</button>
                        </div>

                        {/* fixtures (draggable) */}
                        <div className="mt-4">
                        <h4 className="text-base font-bold text-slate-800 mb-2">Match Schedule (Fixtures)</h4>
                        {(ev.fixtures || []).length === 0 && <div className="text-sm text-slate-500 p-2 border rounded bg-slate-50">No fixtures yet. Use "Auto Generate Fixtures" or "+ Add Manual Match".</div>}

                        <Droppable droppableId={`ev-${idx}`}>
                            {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                {(ev.fixtures || []).map((f, fi) => (
                                <Draggable key={f.id} draggableId={String(f.id)} index={fi}>
                                    {(draggableProvided) => (
                                    <div
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        className="flex items-center p-3 rounded-lg border border-slate-200 shadow-md bg-white hover:border-indigo-400 transition-all"
                                    >
                                        {/* Drag Handle */}
                                        <div {...draggableProvided.dragHandleProps} className="text-slate-400 cursor-grab p-1 mr-2 shrink-0 hover:text-indigo-600">
                                            <GripVertical size={20} />
                                        </div>
                                        
                                        {/* Match Details */}
                                        <div className="flex flex-1 items-center gap-2 md:gap-4">
                                            
                                            {/* Team A Select */}
                                            <select 
                                                className="flex-1 p-2 border rounded min-w-[150px] font-medium text-blue-800 bg-blue-50" 
                                                value={getParticipantValue(f.teamA)} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const id = val.split("::")[1];
                                                    // Find the participant from the pre-calculated list
                                                    const part = fixtureSelectParticipants.find(p => String(p.id) === String(id)); 
                                                    if (!part) return updateFixture(idx, f.id, { teamA: { id: null, name: "" } });
                                                    updateFixture(idx, f.id, { teamA: part });
                                                }}
                                            >
                                                <option value="">-- Select Team A --</option>
                                                <optgroup label={`Participants (${ev.type === 'Internal Group' ? 'Players' : 'Teams/Players'})`}>
                                                    {fixtureSelectParticipants.map(p => 
                                                        <option 
                                                            key={`part-${p.id}`} 
                                                            value={getParticipantValue(p)}
                                                        >
                                                            {p.name}
                                                        </option>
                                                    )}
                                                </optgroup>
                                            </select>

                                            <span className="text-slate-500 font-bold shrink-0">VS</span>

                                            {/* Team B Select */}
                                            <select 
                                                className="flex-1 p-2 border rounded min-w-[150px] font-medium text-red-800 bg-red-50" 
                                                value={getParticipantValue(f.teamB)} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const id = val.split("::")[1];
                                                    // Find the participant from the pre-calculated list
                                                    const part = fixtureSelectParticipants.find(p => String(p.id) === String(id));
                                                    if (!part) return updateFixture(idx, f.id, { teamB: { id: null, name: "" } });
                                                    updateFixture(idx, f.id, { teamB: part });
                                                }}
                                            >
                                                <option value="">-- Select Team B --</option>
                                                <optgroup label={`Participants (${ev.type === 'Internal Group' ? 'Players' : 'Teams/Players'})`}>
                                                    {fixtureSelectParticipants.map(p => 
                                                        <option 
                                                            key={`partb-${p.id}`} 
                                                            value={getParticipantValue(p)}
                                                        >
                                                            {p.name}
                                                        </option>
                                                    )}
                                                </optgroup>
                                            </select>

                                            <input type="datetime-local" className="p-2 border rounded w-auto shrink-0" value={f.scheduledAt || ""} onChange={(e) => updateFixture(idx, f.id, { scheduledAt: e.target.value })} />
                                            <input type="text" placeholder="Court" className="p-2 border rounded w-24 shrink-0" value={f.court || ""} onChange={(e) => updateFixture(idx, f.id, { court: e.target.value })} />
                                        </div>

                                        {/* Delete Button */}
                                        <button className="p-2 ml-4 shrink-0 text-red-600 border border-red-300 rounded shadow-sm hover:bg-red-50" onClick={() => deleteFixture(idx, f.id)}>
                                            <X size={18} />
                                        </button>
                                    </div>
                                    )}
                                </Draggable>
                                ))}
                            {provided.placeholder}
                            </div>
                            )}
                        </Droppable>
                        </div>
                    </div>
                );})}
              </div>
            </DragDropContext>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t">
            {/* SYNCHRONIZATION POINT 4: Close button uses onClose(false) */}
            <button className="px-4 py-2 border rounded hover:bg-slate-100" onClick={() => onClose(false)}>Cancel</button>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => saveTournament(false)} disabled={loading}>Save Draft</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => saveTournament(true)} disabled={loading}>Publish</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- AddPlayer inline component ---------- */
function AddPlayerForm({ onAdd }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="mt-3 p-3 rounded border bg-slate-50">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className="p-2 border rounded" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="p-2 border rounded" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => { onAdd(name, email); setName(""); setEmail(""); }}>Add Player</button>
        </div>
      </div>
    </div>
  );
}