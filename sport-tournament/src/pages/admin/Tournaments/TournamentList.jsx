// src/pages/admin/Tournaments/TournamentList.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  Trash2,
  PlusSquare,
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  Users,
  Trophy,
  
} from "lucide-react";



// CreateTournament modal (your file)
import CreateTournament from "../Tournaments/CreateTournament";


/* ================= HELPERS ================= */
/* ================= HELPERS ================= */
/* ================= HELPERS ================= */

function normalizeRounds(event) {

  // Knockout works based on fixture.round values
  if (event.format === "Knockout") {
    const rounds = {};
    (event.fixtures || []).forEach(f => {
      rounds[f.round] = rounds[f.round] || [];
      rounds[f.round].push(f);
    });

    return Object.entries(rounds)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([roundNum, matches]) => ({
        round: Number(roundNum),
        matches
      }));
  }

  // Round robin: generate just 1 single round grouping
  if (event.format === "Round Robin") {
    return [
      {
        round: 1,
        matches: event.fixtures || []
      }
    ];
  }

  return [];
}

/* ================= PARTICIPANT NAME HELPER ================= */

function getParticipantName(participant, eventType) {
  if (!participant) return "—";

  const type = eventType?.toLowerCase();

  /* ===== TEAM ===== */
  if (type === "team") {
    return (
      participant.teamName ||
      participant.name ||
      "Team"
    );
  }

  /* ===== DOUBLE (PADEL / BADMINTON / TENNIS DOUBLES) ===== */
  if (type === "double") {
    // Preferred structure: players[]
    if (Array.isArray(participant.players) && participant.players.length) {
      return participant.players
        .map(p =>
          p.firstName
            ? `${p.firstName} ${p.lastName || ""}`
            : p.name || "Player"
        )
        .join(" / ");
    }

    // Fallbacks
    if (participant.teamName) return participant.teamName;
    if (participant.name) return participant.name;

    return "Pair";
  }

  /* ===== INDIVIDUAL ===== */
  if (participant.firstName) {
    return `${participant.firstName} ${participant.lastName || ""}`;
  }

  if (participant.name) return participant.name;

  return "Player";
}


/* ===== API wrapper (uses your backend routes) ===== */
const API_BASE = "http://localhost:5000/api/tournaments";

let MOCK_TOURNAMENTS = []; // fallback

const useApi = () => {
  return {
    async getAll() {
      try {
        const res = await axios.get(`${API_BASE}/all`);
        return res.data;
      } catch (err) {
        console.warn("GET /all failed, using mock", err?.message);
        return MOCK_TOURNAMENTS;
      }
    },
    async get(id) {
      try {
        const res = await axios.get(`${API_BASE}/${id}`);
        return res.data;
      } catch (err) {
        console.warn(`GET /${id} failed, using mock`, err?.message);
        return MOCK_TOURNAMENTS.find((t) => String(t.id) === String(id)) || null;
      }
    },
    async add(payload) {
      try {
        const res = await axios.post(`${API_BASE}/add`, payload);
        return res.data;
      } catch (err) {
        console.warn("POST /add failed, adding to mock", err?.message);
        const newT = { ...payload, id: Date.now() };
        MOCK_TOURNAMENTS.push(newT);
        return newT;
      }
    },
    async edit(id, payload) {
      try {
        const res = await axios.post(`${API_BASE}/edit/${id}`, payload);
        return res.data;
      } catch (err) {
        console.warn(`POST /edit/${id} failed, editing mock`, err?.message);
        const idx = MOCK_TOURNAMENTS.findIndex((x) => String(x.id) === String(id));
        if (idx >= 0) MOCK_TOURNAMENTS[idx] = { ...MOCK_TOURNAMENTS[idx], ...payload, id };
        else MOCK_TOURNAMENTS.push({ ...payload, id });
        return MOCK_TOURNAMENTS.find((x) => String(x.id) === String(id));
      }
    },
    async delete(id) {
      try {
        await axios.delete(`${API_BASE}/delete/${id}`);
        return true;
      } catch (err) {
        console.warn(`DELETE /delete/${id} failed, removing from mock`, err?.message);
        MOCK_TOURNAMENTS = MOCK_TOURNAMENTS.filter((x) => String(x.id) !== String(id));
        return true;
      }
    },
    async generateFixtures(tid, eid) {
  const t = await this.get(tid);
  const ev = t.events.find(e => String(e.id) === String(eid));

  const participants = [...(ev.participants || [])];
  participants.sort(() => Math.random() - 0.5);

  const rounds = [];
  let current = participants;
  let roundNo = 1;
  let matchId = 1;

  while (current.length > 1) {
    const matches = [];

    for (let i = 0; i < current.length; i += 2) {
      matches.push({
        id: `m${matchId++}`,
        teamA: current[i] || null,
        teamB: current[i + 1] || null,
        winner: null,
        nextMatchId: null,
        nextSlot: null,
        score: null,
        status: "Scheduled"
      });
    }

    rounds.push({
      round: roundNo,
      name:
        current.length === 2
          ? "Final"
          : roundNo === 1
          ? "Round 1"
          : `Round ${roundNo}`,
      matches
    });

    current = new Array(Math.ceil(current.length / 2)).fill(null);
    roundNo++;
  }

  // 🔗 LINK MATCHES TO NEXT ROUND
  for (let r = 0; r < rounds.length - 1; r++) {
    rounds[r].matches.forEach((m, i) => {
      m.nextMatchId = rounds[r + 1].matches[Math.floor(i / 2)].id;
      m.nextSlot = i % 2 === 0 ? "A" : "B";
    });
  }

  ev.rounds = rounds;
  ev.fixtures = []; // ❗important
  await this.edit(t.id, t);
  return ev;
},
    // helper: update fixture by loading tournament, modifying locally, calling edit
    async updateFixture(tid, eventId, fixtureId, updateObj) {
      try {
        const t = await this.get(tid);
        if (!t) throw new Error("tournament not found");
        const events = (t.events || []).map((ev) => {
          if (String(ev.id) !== String(eventId)) return ev;
          return {
            ...ev,
            fixtures: (ev.fixtures || []).map((f) => (String(f.id) === String(fixtureId) ? { ...f, ...updateObj } : f)),
          };
        });
        const updatedT = { ...t, events };
        await this.edit(t.id, updatedT);
        return updatedT;
      } catch (err) {
        console.warn("updateFixture error, fallback mock", err?.message);
        const idx = MOCK_TOURNAMENTS.findIndex((x) => String(x.id) === String(tid));
        if (idx === -1) throw new Error("tournament not in mock");
        const t = MOCK_TOURNAMENTS[idx];
        t.events = (t.events || []).map((ev) => {
          if (String(ev.id) !== String(eventId)) return ev;
          return { ...ev, fixtures: (ev.fixtures || []).map((f) => (String(f.id) === String(fixtureId) ? { ...f, ...updateObj } : f)) };
        });
        MOCK_TOURNAMENTS[idx] = t;
        return t;
      }
    },
  };
};

/* ===== Helpers ===== */
const uid = (prefix = "") => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
const formatDate = (dStr) => {
  if (!dStr) return "TBD";
  const d = new Date(dStr);
  if (isNaN(d)) return "TBD";
  return d.toLocaleDateString();
};

/* ===== Scoring engines (kept for future expansion) ===== */
// ... (if you want to use the point-by-point UI engines, keep the functions here)
// For brevity I keep only the UI & fixture update flow in this file.

/* ===== Knockout advancement ===== */
function advanceKnockoutInEvent(event) {
  if (!event || !Array.isArray(event.fixtures)) return event;
  const fixturesByRound = {};
  event.fixtures.forEach((f) => {
    fixturesByRound[f.round] = fixturesByRound[f.round] || [];
    fixturesByRound[f.round].push(f);
  });
  const rounds = Object.keys(fixturesByRound).map(Number).sort((a, b) => a - b);
  if (!rounds.length) return event;

  const winnersByRound = {};
  for (const r of rounds) {
    winnersByRound[r] = fixturesByRound[r]
      .filter((f) => f.status === "Completed" && f.score)
      .map((f) => {
        if (f.score?.sets) {
          // Check set wins, including tiebreak logic (ta/tb)
          let aSets = 0;
          let bSets = 0;
          
          (f.score.sets || []).forEach(s => {
            const a = s.a != null ? Number(s.a) : 0;
            const b = s.b != null ? Number(s.b) : 0;
            const ta = s.ta != null ? Number(s.ta) : null;
            const tb = s.tb != null ? Number(s.tb) : null;
            
            if (a > b) aSets++;
            else if (b > a) bSets++;
            // Tiebreak logic for set winner
            else if (a === b && a >= 6 && ta !== null && tb !== null) {
                if (ta > tb) aSets++;
                else if (tb > ta) bSets++;
            }
          });
          
          return aSets > bSets ? f.teamA : bSets > aSets ? f.teamB : null;

        }
        if (typeof f.score?.a !== "undefined" && typeof f.score?.b !== "undefined") {
          return Number(f.score.a) > Number(f.score.b) ? f.teamA : f.teamB;
        }
        return null;
      })
      .filter(Boolean);
  }

  for (const r of rounds) {
    const winners = winnersByRound[r] || [];
    if (!winners.length) continue;
    const nextRound = r + 1;
    const nextSlots = (event.fixtures || []).filter((f) => f.round === nextRound);
    let wi = 0;
    for (const slot of nextSlots) {
      if (wi >= winners.length) break;
      if (!slot.teamA) {
        slot.teamA = winners[wi++];
        continue;
      }
      if (!slot.teamB) {
        slot.teamB = winners[wi++];
        continue;
      }
    }
    while (wi < winners.length) {
      const a = winners[wi++];
      const b = winners[wi++] || null;
      const newF = {
        id: uid("f-"),
        round: nextRound,
        teamA: a || null,
        teamB: b || null,
        scheduledAt: null,
        court: null,
        status: b ? "Scheduled" : "Scheduled",
        score: null,
      };
      event.fixtures.push(newF);
    }
  }
  return event;
}

/* ===== Main Component ===== */
export default function TournamentList() {
  const api = useApi();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createInitial, setCreateInitial] = useState(null);

  const [viewTournament, setViewTournament] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const all = await api.getAll();
      setTournaments(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error("loadAll error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

 async function handleDelete(id) {
  if (!window.confirm("Delete tournament?")) return;

  try {
    // close view modal if open
    setViewTournament(null);

    await api.delete(id);

    // reload clean list
    await loadAll();
  } catch (err) {
    console.error("delete failed", err);
    alert("Delete failed");
  }
}


  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <TopBar onCreate={() => { setCreateInitial(null); setShowCreate(true); }} />
      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading tournaments…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {tournaments.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400 border rounded bg-white">No tournaments yet — click Create Tournament to start</div>
          ) : (
            tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                t={t}
                onView={() => setViewTournament(t)}
                onEdit={() => {
                               setViewTournament(null);   // close detail panel
                               setCreateInitial(t);       // pass data
                                setShowCreate(true);       // open create/edit modal
                              }}

                onDelete={() => handleDelete(t.id)}
              />
            ))
          )}
        </div>
      )}

      {/* CREATE TOURNAMENT MODAL
          NOTE: CreateTournament expects props: initialData, api, onClose(refresh:boolean)
      */}
      {showCreate && (
        <CreateTournament
          initialData={createInitial}
          api={api}
          onClose={(refresh) => {
            // onClose may be called with true when publish happened
            setShowCreate(false);
            setCreateInitial(null);
            if (refresh) loadAll();
          }}
        />
      )}

      {viewTournament && (
        <TournamentPanel
          tournament={viewTournament}
          onClose={() => { setViewTournament(null); loadAll(); }}
          onRefresh={() => loadAll()}
          api={api}
        />
      )}
    </div>
  );
}

/* ===== TopBar & Card ===== */
function TopBar({ onCreate }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Tournament Dashboard</h1>
        <p className="text-sm text-slate-500">Manage events, fixtures and live scoring.</p>
      </div>
      <div>
        <button onClick={onCreate} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-indigo-700 transition">
          <PlusSquare size={16} /> Create Tournament
        </button>
      </div>
    </div>
  );
}

function TournamentCard({ t, onView, onEdit, onDelete }) {
  const totalMatches = (t.events || []).reduce((sum, e) => {
  if (e.rounds?.length) {
    return sum + e.rounds.reduce((s, r) => s + r.matches.length, 0);
  }
  return sum + (e.fixtures?.length || 0);
}, 0);

  const totalParticipants = (t.events || []).reduce((acc, ev) => {
  if (ev.type === "double" || ev.type === "team") {
    return acc + (ev.participants?.length || 0);
  }
  return acc + (ev.participants?.length || 0);
}, 0);


  const colorMap = { green: "bg-green-600", blue: "bg-indigo-600", default: "bg-slate-700" };
  const headerBg = colorMap[t.color || "default"];
  const dateColor = t.color === "green" ? "text-green-200" : "text-indigo-200";

  return (
    <div className="rounded-2xl shadow-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-transform duration-200 relative bg-white border border-slate-200">
      <div className={`h-36 relative overflow-hidden ${headerBg} flex items-center justify-center`}>
        <div className="text-white text-center">
          <Trophy size={48} className="mx-auto" />
          <div className="text-xs font-semibold mt-1">{t.sportType} | {t.eventMaster}</div>
        </div>
        <div className="absolute top-2 left-2 right-2 text-center text-xs font-bold text-white">{(t.name || "").toUpperCase()}</div>
        <div className="absolute bottom-2 left-4 text-xs font-bold text-white flex flex-col items-start">
          <p className={dateColor}><Calendar size={14} className="inline mr-1" /> {formatDate(t.startDate)} - {formatDate(t.endDate)}</p>
          <p className={dateColor}><MapPin size={14} className="inline mr-1" /> {t.venue || "TBD"}</p>
        </div>
        <div className="absolute top-2 right-2 px-3 py-1 text-xs font-bold text-white rounded-full bg-black/30">{(t.events || []).length} Events</div>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-slate-800 mb-2 truncate" title={t.name}>{t.name}</h3>

        <div className="grid grid-cols-2 text-center text-xs border-t pt-3 mt-3">
          <div>
            <div className="font-bold text-indigo-700 text-lg">{totalMatches}</div>
            <div className="text-slate-500">Matches</div>
          </div>
          <div>
            <div className="font-bold text-indigo-700 text-lg">{totalParticipants}</div>
            <div className="text-slate-500">Participants</div>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center pt-3 border-t">
          <button onClick={(e) => { e.stopPropagation(); onView(); }} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-md">
            <Eye size={16} className="inline mr-1" /> View
          </button>
          <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-full hover:bg-yellow-100 text-yellow-600" title="Edit"><Pencil size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-full hover:bg-red-100 text-red-600" title="Delete"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>

      {/* keep the card clickable to view */}
      
    </div>
  );
}

/* ===== Tournament Panel (detail view) ===== */
function TournamentPanel({ tournament: initialTournament, onClose, onRefresh, api }) {
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  //  for the tie-breaker and golden point in the editmodalopen form 
  const [tempSetFormat, setTempSetFormat] = useState(selectedMatch?.setFormat || 3);
const [tempGoldenPoint, setTempGoldenPoint] = useState(selectedMatch?.goldenPoint || false);
const [tempTiebreak, setTempTiebreak] = useState(selectedMatch?.tiebreak || false);

// FIX: Defines variables to prevent "Not Defined" errors

const [tempUrl, setTempUrl] = useState("");
const [tempScores, setTempScores] = useState({ a: 0, b: 0 });

const openEditModal = (match) => {
  setSelectedMatch(match);
  setTempUrl(match.streamUrl || "");
  setTempScores({ a: match.score?.a || 0, b: match.score?.b || 0 });
  setIsEditModalOpen(true);
};
  const [t, setT] = useState(initialTournament);
  const [tab, setTab] = useState("overview");
  const [selectedEventId, setSelectedEventId] = useState(initialTournament.events?.[0]?.id || null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [scoringOpen, setScoringOpen] = useState(false);
  
  // NEW STATE for Standings Sort Logic
  const [standingsSort, setStandingsSort] = useState("points_diff"); // 'points_diff' or 'head2head'

  useEffect(() => {
    setT(initialTournament);
    setSelectedEventId(initialTournament.events?.[0]?.id || null);
    setSelectedFixture(null);
  }, [initialTournament]);

  // reload tournament from API
  const reload = async () => {
    try {
      const fresh = await api.get(initialTournament.id);
      if (fresh) setT(fresh);
      onRefresh && onRefresh();
    } catch (err) {
      console.error("reload failed", err);
    }
  };

  useEffect(() => {
    // choose selected fixture if absent
    if (!selectedFixture) {
      const all = (t.events || []).flatMap((ev) => (ev.fixtures || []).map((f) => ({ ...f, eventId: ev.id })));
      const live = all.find((f) => f.status === "Live");
      setSelectedFixture(live || all[0] || null);
    }
  }, [t, selectedFixture]);

  // save fixture update - robust to missing eventId
  const saveFixtureUpdate = async (maybeEventId, fixtureId, updateObj) => {
    try {
      // if eventId is not provided, find it
      let eventId = maybeEventId;
      if (!eventId) {
        const found = (t.events || []).find((ev) => (ev.fixtures || []).some((f) => String(f.id) === String(fixtureId)));
        if (found) eventId = found.id;
      }
      if (!eventId) throw new Error("eventId not found for fixture");

      // call API helper
      await api.updateFixture(t.id, eventId, fixtureId, updateObj);

      // update local copy
      const events = (t.events || []).map((ev) => {
        if (String(ev.id) !== String(eventId)) return ev;
        return { ...ev, fixtures: (ev.fixtures || []).map((f) => (String(f.id) === String(fixtureId) ? { ...f, ...updateObj } : f)) };
      });
      const newT = { ...t, events };
      setT(newT);

      // if knockout and completed -> advance
      const ev = events.find((e) => String(e.id) === String(eventId));
      const f = ev?.fixtures?.find((x) => String(x.id) === String(fixtureId));
      if (ev?.format === "Knockout" && updateObj.status === "Completed") {
        const updatedEvent = advanceKnockoutInEvent(ev);
        const updatedEvents2 = (newT.events || []).map((ee) => (String(ee.id) === String(updatedEvent.id) ? updatedEvent : ee));
        const updatedT2 = { ...newT, events: updatedEvents2 };
        // persist
        await api.edit(t.id, updatedT2);
        setT(updatedT2);
      }

      onRefresh && onRefresh();
      return true;
    } catch (err) {
      console.error("saveFixtureUpdate failed", err);
      alert("Save failed");
      return false;
    }
  };

  const currentEvent = useMemo(() => (t.events || []).find((e) => String(e.id) === String(selectedEventId)) || (t.events || [])[0] || null, [t, selectedEventId]);
  const allFixturesFlat = useMemo(() => (t.events || []).flatMap((ev) => (ev.fixtures || []).map((f) => ({ ...f, eventId: ev.id }))), [t]);

  // scoring modal open
  const openScoringModal = (fixture, eventId) => {
    setSelectedFixture({ ...fixture, eventId });
    setScoringOpen(true);
  };

  const closeScoringModal = () => {
    setSelectedFixture(null);
    setScoringOpen(false);
  };

  // save sets result (best-of-3)
  const handleSaveSets = async (eventId, fixtureId, setResults) => {
  try {
    // 1. Calculate the final simple score for the bracket view
    let setsA = 0;
    let setsB = 0;
    setResults.forEach(s => {
      if (Number(s.a) > Number(s.b)) setsA++;
      else if (Number(s.b) > Number(s.a)) setsB++;
    });

    // 2. Prepare payload
    const payload = {
      score: {
        a: setsA,
        b: setsB,
        sets: setResults // Keep the detailed set data for the live tab
      },
      status: "Live" // Keep it live or set to "Completed" if the match is over
    };

    // 3. Call your existing save function
    const success = await saveFixtureUpdate(eventId, fixtureId, payload);
    if (success) {
      setScoringOpen(false);
      reload(); // Refresh data
    }
  } catch (err) {
    console.error("Scoring failed:", err);
  }
};
  return (
    <div className="fixed inset-0 z-50 bg-black/10 flex items-start justify-center p-4">
      <div className="w-full md:w-[95%] max-w-7xl rounded-2xl shadow-2xl overflow-auto max-h-screen md:max-h-[94vh] bg-white text-slate-800">
        {/* HEADER */}
        <div className="sticky top-0 z-20 shadow-md bg-indigo-600">
          <div className="p-6 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-extrabold">{t.name}</h1>
                <p className="text-sm text-white/80">{t.sportType} | {t.eventMaster}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={reload} className="px-3 py-1 rounded-full font-semibold bg-white text-indigo-600">Refresh</button>
            </div>
          </div>

          {/* TABS */}
          <div className="border-b border-slate-200 bg-white py-3 px-6 flex gap-6 overflow-x-auto">
            {["overview", "participants", "schedule", "live", "standings"].map((tb) => (
              <button
                key={tb}
                onClick={() => setTab(tb)}
                className={`px-2 py-1 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                  tab === tb
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tb.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {/* ================= EDIT MODAL POP-UP ================= */}
{isEditModalOpen && selectedMatch && (
  <div className="fixed inset-0 z-200 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

      {/* HEADER */}
      <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
        <h4 className="font-bold uppercase tracking-widest text-sm">
          Update Match Details
        </h4>

        <button
          onClick={() => setIsEditModalOpen(false)}
          className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* BODY */}
      <div className="p-6 space-y-6">

        {/* YOUTUBE URL */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">
            YouTube Live Stream URL
          </label>

          <input
            type="url"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition"
            placeholder="Paste YouTube Link Here"
          />

        </div>

        {/* SET FORMAT DROPDOWN */}
        <div>
          <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">
            Sets Format
          </label>

          <select
            value={tempSetFormat}
            onChange={(e) => setTempSetFormat(Number(e.target.value))}
            className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition"
          >
            <option value={3}>Best of 3 (Padel Default)</option>
            <option value={5}>Best of 5</option>
            <option value={7}>Best of 7</option>
          </select>
        </div>

        {/* SCORE INPUT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">
              Score A
            </label>
            <input
              type="number"
              value={tempScores.a}
              onChange={(e) =>
                setTempScores({ ...tempScores, a: Number(e.target.value) })
              }
              className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-bold"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">
              Score B
            </label>
            <input
              type="number"
              value={tempScores.b}
              onChange={(e) =>
                setTempScores({ ...tempScores, b: Number(e.target.value) })
              }
              className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-center font-bold"
            />
          </div>
        </div>

        {/* TOGGLES */}
        <div className="flex flex-col space-y-4 pt-4 border-t">

          {/* Golden Point */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={tempGoldenPoint}
              onChange={(e) => setTempGoldenPoint(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-semibold text-sm text-slate-700">
              Enable Golden Point Rule
            </span>
          </label>

          {/* Tiebreak */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={tempTiebreak}
              onChange={(e) => setTempTiebreak(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="font-semibold text-sm text-slate-700">
              Enable Tiebreak in Final Set
            </span>
          </label>

        </div>

        {/* SAVE BTN */}
        <button
          onClick={async () => {
            await saveFixtureUpdate(
              selectedMatch.eventId || currentEvent.id,
              selectedMatch.id,
              {
                streamUrl: tempUrl,
                score: {
                  a: tempScores.a,
                  b: tempScores.b,
                },
                setFormat: tempSetFormat,
                goldenPoint: tempGoldenPoint,
                tiebreak: tempTiebreak,
              }
            );

            setIsEditModalOpen(false);
            reload();
          }}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow hover:bg-indigo-700 uppercase"
        >
          Save Changes
        </button>

      </div>
    </div>
  </div>
)}


        {/* CONTENT */}
        <div className="p-6 space-y-6">
          {/* EVENT DROPDOWN */}
          {(tab === "schedule" || tab === "participants" || tab === "standings") &&
            (t.events || []).length > 1 && (
              <div className="flex items-center gap-3">
                <label className="font-semibold text-lg">Select Event:</label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="appearance-none block w-72 py-2 px-4 border rounded-lg shadow-sm bg-white border-slate-300 text-slate-800"
                >
                  {(t.events || []).map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.label || ev.id}
                    </option>
                  ))}
                </select>
              </div>
          )}

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-2xl font-bold pb-2 border-b">Information</h3>
                <p className="text-slate-400">{t.description || "No description provided."}</p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" /> Start: {formatDate(t.startDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-500" /> End: {formatDate(t.endDate)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-500" /> Venue: {t.venue || "TBD"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-indigo-500" /> Total participants:
                    {(t.events || []).flatMap((e) => e.participants || []).length}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 p-4 rounded-lg shadow bg-indigo-50 border border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-700">Live Alert</h3>

                {allFixturesFlat.find((f) => f.status === "Live") ? (
                  <div className="p-4 rounded-lg bg-red-100 text-slate-800">
                    <div className="text-sm font-bold text-red-600 flex items-center gap-2">
                      <Clock size={14} /> MATCH LIVE NOW
                    </div>
                    <div className="text-xl font-extrabold mt-2">
                      {allFixturesFlat.find((f) => f.status === "Live").teamA?.name || "TBD"} vs{" "}
                      {allFixturesFlat.find((f) => f.status === "Live").teamB?.name || "TBD"}
                    </div>
                    <button onClick={() => setTab("live")} className="mt-3 px-3 py-1 bg-red-600 text-white rounded">Go Live</button>
                  </div>
                ) : (
                  <div className="p-4 text-slate-500">No match currently live.</div>
                )}
              </div>
            </div>
          )}

          {/* PARTICIPANTS */}
          {tab === "participants" && currentEvent && (
            <ParticipantsList event={currentEvent} />
          )}

          {/* SCHEDULE */}
        {tab === "schedule" && currentEvent && (
  <div className="space-y-6">

    <h3 className="text-2xl font-black text-slate-800 uppercase italic">
      Schedule : {currentEvent.label}
    </h3>

    {/* ADMIN CHECK */}
    {(() => {
      const isAdmin = true;

      // if knockout → bracket layout
      if (currentEvent.format === "Knockout") {
        return (
          <KnockoutSchedule
            event={currentEvent}
            isAdmin={isAdmin}
            onEditClick={(match) => openEditModal(match)}
            onFixtureClick={(f) => {
              setSelectedFixture({ ...f, eventId: currentEvent.id });
              setTab("live");
            }}
          />
        );
      }

      // else → Round Robin or Custom: fixture list by rounds
      return (
        <RoundRobinSchedule
          event={currentEvent}
          isAdmin={isAdmin}
          onEditClick={(match) => openEditModal(match)}
          onFixtureClick={(f) => {
            setSelectedFixture({ ...f, eventId: currentEvent.id });
            setTab("live");
          }}
        />
      );
    })()}
  </div>
)}



              {/* LIVE */}
          {tab === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <h3 className="text-2xl font-bold mb-4">Live Scoring</h3>

                {selectedFixture ? (
                  <LiveScoring
                    tournament={t}
                    fixture={selectedFixture}
                    eventId={
                      selectedFixture.eventId ||
                      (t.events &&
                        t.events.find((ev) =>
                          ev.fixtures?.some((ff) => ff.id === selectedFixture.id)
                        )?.id)
                    }
                    onOpenScoring={openScoringModal}
                    onUpdate={(payload) =>
                      saveFixtureUpdate(selectedFixture.eventId, selectedFixture.id, payload)
                    }
                    onRefresh={reload}
                  />
                ) : (
                  <div className="p-6 border rounded">Select a match from the right to score.</div>
                )}
              </div>

              <div className="lg:col-span-1">
  <h3 className="text-xl font-bold mb-3">Matches</h3>

  <div className="border rounded-lg max-h-[60vh] overflow-y-auto shadow bg-white">
    {allFixturesFlat.map((f) => {
      // STATUS styles
      const isCompleted = f.status === "Completed";
      const isLive = f.status === "Live" || f.status === "live";
      const isPaused = f.status === "Paused";

      // ROW background logic
      let rowStyle = "";
      if (isCompleted) rowStyle = "bg-green-100 border-green-400";
      else if (isLive) rowStyle = "bg-red-50 border-red-200";
      else rowStyle = "bg-white";

      // SELECTED highlight override
      if (selectedFixture?.id === f.id) {
        rowStyle = "bg-indigo-100 font-bold border-indigo-300";
      }

      return (
        <div
          key={f.id}
          className={`
            p-3 border-b flex justify-between items-center cursor-pointer transition-all
            ${rowStyle}
            hover:bg-slate-100
          `}
          onClick={() => setSelectedFixture({ ...f })}
        >
          {/* LEFT SIDE */}
          <div>
            <div className="font-medium flex items-center gap-2">

              {/* LIVE RED DOT ONLY */}
              {isLive && (
                <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
              )}

              {/* COMPLETED check icon */}
              {isCompleted && (
                <span className="h-2 w-2 rounded-full bg-green-700"></span>
              )}

              {f.teamA?.name || "TBD"} vs {f.teamB?.name || "TBD"}
            </div>

            <div className="text-xs text-slate-500">
              {f.status} {f.court ? `• Court ${f.court}` : ""}
            </div>
          </div>

          {/* RIGHT SCORE SIDE */}
          <div className="font-bold text-lg">
            {f.score && typeof f.score.a !== "undefined"
              ? `${f.score.a} - ${f.score.b}`
              : "—"}
          </div>
        </div>
      );
    })}
  </div>
</div>

            </div>
          )}

          {/* STANDINGS */}
          {tab === "standings" && currentEvent && (
            <div>
              <h3 className="text-2xl font-bold mb-4">Standings: {currentEvent.label}</h3>

              <div className="flex items-center gap-3 mb-4">
                <label className="font-semibold text-lg text-slate-700">Sort By:</label>
                <select
                  value={standingsSort}
                  onChange={(e) => setStandingsSort(e.target.value)}
                  className="appearance-none block w-48 py-2 px-4 border rounded-lg shadow-sm bg-white border-slate-300 text-slate-800"
                >
                  <option value="points_diff">Points & Goal/Game Difference</option>
                  <option value="head2head">Head-to-Head (Tiebreaker)</option>
                </select>
              </div>

              <StandingsTable event={currentEvent} sortMethod={standingsSort} />
            </div>
          )}
        </div>

        {/* SCORING MODAL */}
        {scoringOpen && selectedFixture && (
          <ScoringModal
            fixture={selectedFixture}
            eventId={selectedFixture.eventId || currentEvent?.id}
            onClose={closeScoringModal}
            onSave={handleSaveSets}
            teamAName={selectedFixture.teamA?.name || "Team A"}
            teamBName={selectedFixture.teamB?.name || "Team B"}
          />
        )}
      </div>
    </div>
  );
}

/* ===== Subcomponents ===== */
const KnockoutSchedule = ({ event, isAdmin, onEditClick, onFixtureClick }) => {
  if (!event.fixtures?.length) {
    return <p className="text-center text-sm text-slate-400">No knockout fixtures added yet.</p>;
  }

  const rounds = {};

  event.fixtures.forEach(f => {
    rounds[f.round] = rounds[f.round] || [];
    rounds[f.round].push(f);
  });

  const sortedRoundKeys = Object.keys(rounds).sort((a,b) => Number(a) - Number(b));

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex gap-12 min-w-max">

        {sortedRoundKeys.map((roundNumber) => (
          <div key={roundNumber} className="flex flex-col gap-6 min-w-[310px]">

            <div className="text-center font-black uppercase text-xs tracking-widest text-slate-400">
              Round {roundNumber}
            </div>

            {rounds[roundNumber].map((f) => (
              <FixtureRow
                key={f.id}
                f={f}
                isAdmin={isAdmin}
                onEditClick={onEditClick}
                onClick={() => onFixtureClick(f)}
              />
            ))}

          </div>
        ))}

      </div>
    </div>
  );
};

const RoundRobinSchedule = ({ event, isAdmin, onFixtureClick, onEditClick }) => {
  if (!event.fixtures?.length) {
    return <p className="text-center text-sm text-slate-400">No fixtures scheduled.</p>;
  }

  const rounds = {};

  event.fixtures.forEach(f => {
    const r = f.round || 1;
    rounds[r] = rounds[r] || [];
    rounds[r].push(f);
  });

  const sortedRoundKeys = Object.keys(rounds).sort((a,b) => Number(a) - Number(b));

  return (
    <div className="flex flex-col gap-10">

      {sortedRoundKeys.map((r) => (
        <div key={r} className="flex flex-col gap-4">

          <div className="font-black uppercase italic tracking-wider text-slate-700 text-sm">
            Round {r}
          </div>

          {rounds[r].map((f) => (
            <FixtureRow
              key={f.id}
              f={f}
              isAdmin={isAdmin}
              onEditClick={onEditClick}
              onClick={() => onFixtureClick(f)}
            />
          ))}

        </div>
      ))}
    </div>
  );
};


function ParticipantsList({ event }) {
  return (
    <div className="p-4 border rounded shadow bg-white">
      <h4 className="text-xl font-semibold mb-4">
        {event.label} Participants
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded">
        {(event.participants || []).length > 0 ? (
          event.participants.map((p) => (
            <div
              key={p.id}
              className="p-3 border rounded bg-white shadow-sm"
            >
              <div className="font-bold text-indigo-600">
                {p.teamName || p.name || `Participant ${p.id}`}
              </div>

              {Array.isArray(p.players) && (
                <div className="text-sm text-slate-600 mt-1">
                  {p.players.map((pl) =>
                    pl.name ||
                    `${pl.firstName || ""} ${pl.lastName || ""}`.trim()
                  ).join(" & ")}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="col-span-3 text-slate-500">
            No participants registered.
          </p>
        )}
      </div>
    </div>
  );
}

const FixtureRow = ({ f, onClick, isAdmin, onEditClick }) => {
  const isCompleted = f.status === "Completed" || f.status === "completed";
  const isLive = f.status === "Live" || f.status === "live";

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer w-full
        ${isCompleted ? "border-green-500 bg-green-50/50" : "border-slate-100 bg-white shadow-sm"}
        ${isLive ? "border-red-500 ring-4 ring-red-50 shadow-lg shadow-red-100" : "hover:border-indigo-400"}
      `}
    >
      <div className="flex-1">
        {/* Team A */}
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-bold ${isCompleted && Number(f.score?.a) > Number(f.score?.b) ? "text-green-700" : "text-slate-700"}`}>
            {f.teamA?.name || "TBD"}
          </span>
          <span className="bg-white border-2 border-slate-50 px-3 py-1 rounded-lg font-black text-indigo-600 shadow-sm text-xs">
            {f.score?.a ?? 0}
          </span>
        </div>

        {/* Separator */}
        <div className="h-px bg-slate-100 w-full my-2" />

        {/* Team B */}
        <div className="flex justify-between items-center">
          <span className={`text-sm font-bold ${isCompleted && Number(f.score?.b) > Number(f.score?.a) ? "text-green-700" : "text-slate-700"}`}>
            {f.teamB?.name || "TBD"}
          </span>
          <span className="bg-white border-2 border-slate-50 px-3 py-1 rounded-lg font-black text-indigo-600 shadow-sm text-xs">
            {f.score?.b ?? 0}
          </span>
        </div>
      </div>

      {/* Admin Section */}
      <div className="ml-4 pl-4 border-l border-slate-100 flex items-center gap-2">
        {isLive && <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation(); // CRITICAL: This stops the box click!
              onEditClick(f);
            }}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-90"
          >
            <Pencil size={15} />
          </button>
        )}
      </div>
    </div>
  );
};
function VerticalKnockoutBracket({ event, isAdmin, onEditClick, onFixtureClick }) {
  const rounds = {};
  (event.fixtures || []).forEach((f) => {
    rounds[f.round] = rounds[f.round] || [];
    rounds[f.round].push(f);
  });
  const sorted = Object.keys(rounds).map((r) => Number(r)).sort((a,b) => a-b);
  
  if (!sorted.length) return <p className="text-sm text-slate-500">No fixtures available.</p>;

  return (
    <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200 overflow-x-auto">
      <div className="flex gap-12 items-start min-w-max">
        {sorted.map((roundNum) => (
          <div key={roundNum} className="flex flex-col gap-6 min-w-[320px]">
            <h5 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] text-center bg-white py-2 rounded-full border border-slate-100 shadow-sm">
              Round {roundNum}
            </h5>
            
            <div className="flex flex-col justify-around gap-8">
              {rounds[roundNum].map((f) => (
                /* CRITICAL: We call FixtureRow here so it uses 
                   the Green/Live/Pencil design automatically! 
                */
                <FixtureRow 
                  key={f.id} 
                  f={f} 
                  isAdmin={isAdmin} 
                  onEditClick={onEditClick}
                  onClick={() => onFixtureClick(f)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Live Scoring & Scoring Modal (kept UI similar to your original) ===== */

function LiveScoring({ tournament, fixture, eventId, onOpenScoring, onUpdate, onRefresh }) {
  const sport = (tournament.sportType || "").toLowerCase();

  const isSetWise = ["padel", "tennis", "badminton", "table tennis"].some(s => sport.includes(s));
  const isGoal = ["football", "hockey"].some(s => sport.includes(s));
  const isPoint = ["volley", "kabaddi"].some(s => sport.includes(s));
  const isCricket = sport.includes("cricket");

  const teamA = fixture.teamA?.name || "Team A";
  const teamB = fixture.teamB?.name || "Team B";

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <div className="text-xl font-bold">{teamA} vs {teamB}</div>
          <div className="text-sm text-slate-500">Match ID: {fixture.id}</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onOpenScoring(fixture, eventId)}
            className="px-4 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700"
          >
            Enter Score
          </button>

          <button
  onClick={async () => {

    // === LOGIC MAP =======================================
    // "Scheduled"   → click → "Live"
    // "Live"        → click → "Paused"
    // "Paused"      → click → "Live"
    // "Completed"   → no change allowed

    let newStatus = fixture.status;

    if (fixture.status === "Scheduled" || fixture.status === "Pending") {
      newStatus = "Live";
    } 
    else if (fixture.status === "Live") {
      newStatus = "Paused";
    } 
    else if (fixture.status === "Paused") {
      newStatus = "Live";
    }

    // ================== AUTO COMPLETE LOGIC ==================
    const scoreIsFinished =
      fixture.score &&
      (
        (typeof fixture.score.a === "number" &&
         typeof fixture.score.b === "number" &&
         (fixture.score.a > 0 || fixture.score.b > 0))
        ||
        (Array.isArray(fixture.score.sets) &&
         fixture.score.sets.length > 0)
      );

    if (scoreIsFinished && newStatus === "Live") {
      // Future-proof: if score exists and match is resumed → finish it instead
      newStatus = "Completed";
    }

    // stop completed match changing status
    if (fixture.status === "Completed") return;

    await onUpdate({ status: newStatus });
  }}

  className={`
    px-4 py-2 rounded shadow font-semibold text-white transition
    ${fixture.status === "Live"     ? "bg-red-600 hover:bg-red-700"     :
      fixture.status === "Paused"   ? "bg-yellow-500 hover:bg-yellow-600" :
      fixture.status === "Completed"? "bg-green-700 opacity-70 cursor-not-allowed" :
                                       "bg-indigo-600 hover:bg-indigo-700"}
  `}
  disabled={fixture.status === "Completed"}
>
  {fixture.status === "Scheduled" || fixture.status === "Pending"
    ? "Start Live"
    : fixture.status === "Live"
      ? "Pause"
      : fixture.status === "Paused"
        ? "Resume"
        : "Completed"}
</button>

        </div>
      </div>

      {/* STATUS BADGE */}
      <div className="text-center">
        <span className={`
          px-4 py-1 rounded-full text-sm font-semibold
          ${(fixture.status === "Live") ? "bg-green-100 text-green-600" :
            (fixture.status === "Paused") ? "bg-yellow-100 text-yellow-600" :
            "bg-slate-200 text-slate-600"}
        `}>
          {fixture.status || "Scheduled"}
        </span>
      </div>

      {/* SCORE DISPLAY */}
      <div className="mt-4">
        {/* SET-WISE */}
        {isSetWise && (
          <div>
            <div className="flex justify-between items-center text-center mb-6">
              <div className="text-6xl font-extrabold text-blue-600">
                {fixture.score?.sets?.filter(s => {
                  const a = s.a != null ? Number(s.a) : 0;
                  const b = s.b != null ? Number(s.b) : 0;
                  const ta = s.ta != null ? Number(s.ta) : null;
                  const tb = s.tb != null ? Number(s.tb) : null;
                  
                  if (a > b) return true;
                  if (a === b && a >= 6 && ta !== null && tb !== null && ta > tb) return true;
                  return false;
                }).length || 0}
              </div>
              <div className="text-xl font-bold text-slate-600">SETS</div>
              <div className="text-6xl font-extrabold text-red-600">
                {fixture.score?.sets?.filter(s => {
                  const a = s.a != null ? Number(s.a) : 0;
                  const b = s.b != null ? Number(s.b) : 0;
                  const ta = s.ta != null ? Number(s.ta) : null;
                  const tb = s.tb != null ? Number(s.tb) : null;
                  
                  if (b > a) return true;
                  if (a === b && a >= 6 && ta !== null && tb !== null && tb > ta) return true;
                  return false;
                }).length || 0}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="font-semibold text-sm">{teamA}</div>
              <div className="font-semibold text-sm text-slate-600">Set</div>
              <div className="font-semibold text-sm">{teamB}</div>

              {(fixture.score?.sets || []).map((set, i) => (
                <React.Fragment key={i}>
                  <div className="p-2 bg-slate-50 rounded flex justify-center items-center">
                    {set.a}
                    {(set.ta !== null && set.ta !== undefined) && <span className="text-xs ml-1 font-normal">({set.ta})</span>}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">Set {i + 1}</div>
                  <div className="p-2 bg-slate-50 rounded flex justify-center items-center">
                    {set.b}
                    {(set.tb !== null && set.tb !== undefined) && <span className="text-xs ml-1 font-normal">({set.tb})</span>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* GOAL SPORTS */}
        {isGoal && (
          <div className="flex justify-between items-center text-center p-4">
            <div className="text-6xl font-extrabold text-blue-600">
              {fixture.score?.a ?? 0}
            </div>
            <div className="text-xl font-bold">GOALS</div>
            <div className="text-6xl font-extrabold text-red-600">
              {fixture.score?.b ?? 0}
            </div>
          </div>
        )}

        {/* POINT SPORTS */}
        {isPoint && (
          <div className="flex justify-between items-center text-center p-4">
            <div className="text-6xl font-extrabold text-blue-600">
              {fixture.score?.a ?? 0}
            </div>
            <div className="text-xl font-bold">POINTS</div>
            <div className="text-6xl font-extrabold text-red-600">
              {fixture.score?.b ?? 0}
            </div>
          </div>
        )}

        {/* CRICKET */}
        {isCricket && (
          <div className="text-center space-y-2">
            <div className="text-4xl font-extrabold text-blue-600">
              {fixture.score?.runs || 0}/{fixture.score?.wickets || 0}
            </div>
            <div className="text-sm text-slate-500">
              Balls: {fixture.score?.balls || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===== Scoring Modal (best-of-3 set-wise) ===== */
function ScoringModal({ fixture, eventId, onClose, onSave, teamAName, teamBName }) {
  const [sets, setSets] = useState(() => {
    const s = (fixture.score?.sets || []).map((x) => ({
      a: x.a ?? null,
      b: x.b ?? null,
      ta: x.ta ?? null,
      tb: x.tb ?? null,
      gp: x.gp ?? null,
    })) || [];
    while (s.length < 3) s.push({ a: null, b: null, ta: null, tb: null, gp: null });
    return s.slice(0, 3);
  });

  const [activeTab, setActiveTab] = useState(0);
  const [isTiebreakMode, setIsTiebreakMode] = useState(false);

  const updateSetScore = (index, team, value) => {
    const newSets = [...sets];
    newSets[index][team] = value === "" ? null : Number(value);
    setSets(newSets);
  };

  const toggleGoldenPoint = (index, team) => {
    const newSets = [...sets];
    newSets[index].gp = newSets[index].gp === team ? null : team;
    setSets(newSets);
  };

  const calculateWinner = () => {
    let setsA = 0, setsB = 0;
    sets.forEach(s => {
      const a = Number(s.a || 0);
      const b = Number(s.b || 0);
      if (a > b) setsA++;
      else if (b > a) setsB++;
      else if (a !== 0 && a === b) {
        if (Number(s.ta || 0) > Number(s.tb || 0)) setsA++;
        else if (Number(s.tb || 0) > Number(s.ta || 0)) setsB++;
      }
    });
    return setsA > setsB ? teamAName : setsB > setsA ? teamBName : "TBD";
  };

  return (
    <div className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Container: Added max-h-[95vh] and overflow-y-auto for accessibility */}
      <div className="bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-y-auto max-h-[95vh] border border-slate-200">
        
        {/* HEADER: FLEX WRAP FIXED */}
        <div className="bg-slate-900 p-5 sm:p-8 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center mb-4">
            <span className="bg-indigo-500 text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-widest">
              Match Official
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-lg font-black uppercase italic truncate text-center leading-tight">
                {teamAName}
              </div>
            </div>
            <div className="shrink-0 bg-white/10 px-3 py-1 rounded-lg border border-white/10 font-black text-xs italic">VS</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm sm:text-lg font-black uppercase italic truncate text-center leading-tight">
                {teamBName}
              </div>
            </div>
          </div>
        </div>

        {/* SET SELECTOR */}
        <div className="flex border-b bg-white sticky top-[100px] sm:top-[140px] z-10">
          {sets.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 font-black text-[10px] uppercase tracking-widest transition-all
                ${activeTab === i ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-400 bg-slate-50/50'}
              `}
            >
              Set {i + 1}
            </button>
          ))}
        </div>

        {/* SCORING AREA */}
        <div className="p-4 sm:p-8 space-y-6">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {/* Team A */}
            <div className="flex-1 space-y-3">
              <input 
                type="number"
                value={sets[activeTab].a ?? ""}
                onChange={(e) => updateSetScore(activeTab, 'a', e.target.value)}
                className="w-full h-16 sm:h-20 text-center text-3xl font-black bg-slate-100 rounded-2xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none"
                placeholder="0"
              />
              <button 
                onClick={() => toggleGoldenPoint(activeTab, 'a')}
                className={`w-full py-2 rounded-lg text-[8px] font-black border transition-all
                  ${sets[activeTab].gp === 'a' ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}
                `}
              >
                GOLDEN POINT
              </button>
            </div>

            <div className="text-slate-300 font-black text-2xl">:</div>

            {/* Team B */}
            <div className="flex-1 space-y-3">
              <input 
                type="number"
                value={sets[activeTab].b ?? ""}
                onChange={(e) => updateSetScore(activeTab, 'b', e.target.value)}
                className="w-full h-16 sm:h-20 text-center text-3xl font-black bg-slate-100 rounded-2xl border-2 border-transparent focus:border-rose-500 focus:bg-white outline-none"
                placeholder="0"
              />
              <button 
                onClick={() => toggleGoldenPoint(activeTab, 'b')}
                className={`w-full py-2 rounded-lg text-[8px] font-black border transition-all
                  ${sets[activeTab].gp === 'b' ? 'bg-amber-500 border-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border-slate-200'}
                `}
              >
                GOLDEN POINT
              </button>
            </div>
          </div>

          {/* TIE-BREAKER SECTION */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tie-Breaker Logic</span>
              <button 
                onClick={() => setIsTiebreakMode(!isTiebreakMode)}
                className={`px-3 py-1 rounded-full text-[8px] font-bold transition-all ${isTiebreakMode ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
              >
                {isTiebreakMode ? "ENABLED" : "+ ADD"}
              </button>
            </div>

            {isTiebreakMode && (
              <div className="flex gap-3">
                <input 
                  type="number"
                  placeholder="TB A"
                  value={sets[activeTab].ta ?? ""}
                  onChange={(e) => updateSetScore(activeTab, 'ta', e.target.value)}
                  className="flex-1 p-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-center text-sm focus:border-indigo-400 outline-none"
                />
                <input 
                  type="number"
                  placeholder="TB B"
                  value={sets[activeTab].tb ?? ""}
                  onChange={(e) => updateSetScore(activeTab, 'tb', e.target.value)}
                  className="flex-1 p-2 bg-white border-2 border-slate-200 rounded-xl font-bold text-center text-sm focus:border-indigo-400 outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* FOOTER: STICKY BOTTOM */}
        <div className="p-5 sm:p-8 bg-white flex flex-col sm:flex-row items-center justify-between border-t gap-4 sticky bottom-0">
          <div className="text-center sm:text-left">
            <div className="text-[9px] font-black text-slate-400 uppercase">Set Winner</div>
            <div className="text-indigo-600 text-sm font-black uppercase truncate max-w-[150px]">{calculateWinner()}</div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-4 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
            <button 
              onClick={() => onSave(eventId, fixture.id, sets)}
              className="flex-1 sm:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg"
            >
              Save Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ===== Standings Table ===== */
function StandingsTable({ event, sortMethod }) {
  const rows = useMemo(() => {
    const map = {};
    const fixtures = event.fixtures || [];

    // 1. Initialize participants - ensuring names show up properly
    (event.participants || []).forEach((p) => {
      const id = p.id;
      // name logic to handle both individual names and team names
      let displayName = p.name || "";
      if (!displayName) {
        if (p.players && p.players.length > 0) {
          displayName = p.players.map(pl => pl.firstName || pl.name).join(" / ");
        } else {
          displayName = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown Participant";
        }
      }

      map[id] = { id, name: displayName, played: 0, w: 0, l: 0, pts: 0, pd: 0, pf: 0, pa: 0 };
    });

    // 2. Process Fixtures
    fixtures.forEach((f) => {
      if (!f.teamA || !f.teamB || !f.score || f.status !== "Completed") return;

      let teamAPoints = 0; 
      let teamBPoints = 0; 
      let teamASets = 0;   
      let teamBSets = 0;   

      if (f.score.sets && f.score.sets.length > 0) {
        f.score.sets.forEach(s => {
          const a = Number(s.a || 0);
          const b = Number(s.b || 0);
          const ta = Number(s.ta || 0);
          const tb = Number(s.tb || 0);

          teamAPoints += (a + ta);
          teamBPoints += (b + tb);

          if (a > b) teamASets++;
          else if (b > a) teamBSets++;
          else if (a === b && (ta > 0 || tb > 0)) {
            if (ta > tb) teamASets++; else if (tb > ta) teamBSets++;
          }
        });
      } else {
        teamAPoints = Number(f.score.a || 0);
        teamBPoints = Number(f.score.b || 0);
        teamASets = teamAPoints;
        teamBSets = teamBPoints;
      }

      const aId = f.teamA.id, bId = f.teamB.id;
      if (!map[aId] || !map[bId]) return;

      map[aId].played++; map[bId].played++;
      map[aId].pf += teamAPoints; map[aId].pa += teamBPoints;
      map[bId].pf += teamBPoints; map[bId].pa += teamAPoints;

      if (teamASets > teamBSets) {
        map[aId].w++; map[aId].pts += 3;
        map[bId].l++;
      } else if (teamBSets > teamASets) {
        map[bId].w++; map[bId].pts += 3;
        map[aId].l++;
      }
    });

    Object.values(map).forEach(r => { r.pd = r.pf - r.pa; });

    let calculatedRows = Object.values(map);

    // Standard primary sort
    const primarySort = (a, b) => b.pts - a.pts || b.pd - a.pd || b.pf - a.pf;

    // 3. SORTING LOGIC (Fixed Reference Error)
    if (sortMethod === "head2head") {
      let sortedRows = [...calculatedRows].sort(primarySort);
      
      for (let i = 0; i < sortedRows.length; i++) {
        let j = i;
        while (j < sortedRows.length - 1 && sortedRows[j + 1].pts === sortedRows[i].pts) {
          j++;
        }

        if (j > i) {
          const tiedGroup = sortedRows.slice(i, j + 1);
          tiedGroup.sort((r1, r2) => {
            const match = fixtures.find(f => 
              f.status === "Completed" &&
              ((f.teamA.id === r1.id && f.teamB.id === r2.id) || 
               (f.teamA.id === r2.id && f.teamB.id === r1.id))
            );

            if (match) {
              const r1IsA = String(match.teamA.id) === String(r1.id);
              const aWon = Number(match.score.a || 0) > Number(match.score.b || 0);
              if (r1IsA ? aWon : !aWon) return -1;
              return 1;
            }
            // FIXED HERE: changed 'b.pd - a.pd' to 'r2.pd - r1.pd'
            return r2.pd - r1.pd; 
          });
          sortedRows.splice(i, tiedGroup.length, ...tiedGroup);
        }
        i = j;
      }
      return sortedRows;
    }

    return calculatedRows.sort(primarySort);
  }, [event, sortMethod]);

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xl mt-4">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white uppercase text-[10px] tracking-widest font-black">
            <th className="py-5 px-6 italic">Rank</th>
            <th className="py-5 px-4 italic">Participant</th>
            <th className="py-5 px-2 text-center">PL</th>
            <th className="py-5 px-2 text-center text-emerald-400">W</th>
            <th className="py-5 px-2 text-center text-rose-400">L</th>
            <th className="py-5 px-2 text-center">PD</th>
            <th className="py-5 px-6 text-right text-indigo-400">PTS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={r.id} className="hover:bg-indigo-50/50 transition-colors group">
              <td className="py-5 px-6 font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                {String(i + 1).padStart(2, '0')}
              </td>
              <td className="py-5 px-4">
                <div className="font-black text-slate-800 text-sm uppercase tracking-tight leading-none">
                  {r.name}
                </div>
              </td>
              <td className="py-5 px-2 text-center font-bold text-slate-600">{r.played}</td>
              <td className="py-5 px-2 text-center font-black text-emerald-600">{r.w}</td>
              <td className="py-5 px-2 text-center font-black text-rose-500">{r.l}</td>
              <td className={`py-5 px-2 text-center font-black text-sm ${r.pd >= 0 ? 'text-slate-800' : 'text-rose-400'}`}>
                {r.pd > 0 ? `+${r.pd}` : r.pd}
              </td>
              <td className="py-5 px-6 text-right">
                <span className="text-xl font-black text-indigo-600 italic">{r.pts}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}