// src/pages/admin/tournaments/TournamentDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, Clock, MapPin, Calendar, Users, Trophy } from "lucide-react";
// import StandingsTable from "../../components/StandingsTable"; // NEW: Standings component
// import KnockoutBracket from "../../components/KnockoutBracket"; // NEW: Knockout visualization
import LiveScoring from "../Tournaments/scoreEditor"; // NEW: Live scoring editor

/*
TournamentDetail.jsx
- Replaces TournamentPanel (from TournamentList.jsx)
- Provides tabbed interface: Overview, Participants, Schedule, Live, Standings, Gallery
- Fetches tournament data and passes it to sub-components
*/

// Mock Component for Standings (will be imported later)
function StandingsTable({ event }) {
    // Simple table mock/placeholder logic from your old TournamentList
    const ptsWin = 3, ptsDraw = 1;
    const map = {};
    (event.participants || []).forEach(p => {
        const id = p.id;
        const nm = p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
        map[id] = { id, name: nm, played: 0, w: 0, l: 0, d: 0, pts: 0 };
    });

    (event.fixtures || []).forEach(f => {
        if (!f.score || f.status !== "Completed") return;
        const aId = f.teamA?.id || f.playerA?.id;
        const bId = f.teamB?.id || f.playerB?.id;
        if (!aId || !bId) return;
        const sa = Number(f.score.a ?? 0), sb = Number(f.score.b ?? 0);
        
        if (map[aId]) map[aId].played++; 
        if (map[bId]) map[bId].played++;

        if (sa > sb) { 
            if (map[aId]) { map[aId].w++; map[aId].pts += ptsWin; } 
            if (map[bId]) { map[bId].l++; }
        } else if (sb > sa) { 
            if (map[bId]) { map[bId].w++; map[bId].pts += ptsWin; } 
            if (map[aId]) { map[aId].l++; }
        } else { 
            if (map[aId]) { map[aId].d++; map[aId].pts += ptsDraw; } 
            if (map[bId]) { map[bId].d++; map[bId].pts += ptsDraw; }
        }
    });

    const rows = Object.values(map).sort((x,y) => (y.pts - x.pts));

    if (rows.length === 0) return <p className="text-sm text-slate-500">No completed matches to calculate standings.</p>;

    return (
        <div className="overflow-x-auto border rounded">
            <table className="w-full text-left">
                <thead className="bg-slate-100 text-xs text-slate-600 uppercase">
                    <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Team/Player</th>
                        <th className="py-2 px-3">Pl</th>
                        <th className="py-2 px-3">W</th>
                        <th className="py-2 px-3">L</th>
                        <th className="py-2 px-3">D</th>
                        <th className="py-2 px-3 font-bold">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r,i) => (
                        <tr key={r.id || r.name} className="border-t hover:bg-slate-50">
                            <td className="py-2 px-3 text-slate-500">{i+1}</td>
                            <td className="py-2 px-3 font-medium text-slate-800">{r.name}</td>
                            <td className="py-2 px-3">{r.played}</td>
                            <td className="py-2 px-3 text-green-600">{r.w}</td>
                            <td className="py-2 px-3 text-red-600">{r.l}</td>
                            <td className="py-2 px-3">{r.d}</td>
                            <td className="py-2 px-3 font-extrabold text-indigo-700">{r.pts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


// Mock Component for KnockoutBracket (Visualization)
function KnockoutBracket({ event }) {
    if (event.format !== "Knockout") return <p className="text-sm text-slate-500">Only applicable for Knockout format.</p>;
    const rounds = {};
    (event.fixtures || []).forEach(f => {
        const roundName = f.round === 1 ? 'R1' : f.round === 2 ? 'QF' : f.round === 3 ? 'SF' : 'Final';
        rounds[roundName] = rounds[roundName] || [];
        rounds[roundName].push(f);
    });
    
    // Simple visual representation of a bracket structure
    return (
        <div className="p-4 bg-white border rounded shadow-inner overflow-x-auto min-w-[600px]">
            <h4 className="text-md font-semibold mb-3">Knockout Diagram  </h4>
            <div className="flex gap-8 items-start">
                {Object.keys(rounds).sort((a,b) => a.localeCompare(b)).map(roundName => (
                    <div key={roundName} className="flex flex-col gap-4 border-r border-slate-300 pr-4">
                        <h5 className="text-xs font-bold text-indigo-600 uppercase mb-2">{roundName}</h5>
                        {rounds[roundName].map(f => (
                            <div key={f.id} className="text-xs border rounded p-2 bg-white shadow-sm w-48">
                                <p className="font-semibold text-slate-800">Match {f.round}-{f.id.split('-').pop().substring(0,2)}</p>
                                <div className="flex justify-between mt-1">
                                    <span>{f.teamA?.name || 'TBD'}</span>
                                    <span className="font-bold">{f.score?.a ?? '—'}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1 mt-1">
                                    <span>{f.teamB?.name || 'TBD'}</span>
                                    <span className="font-bold">{f.score?.b ?? '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Mock Component for Participants List
function ParticipantsList({ participants }) {
    if (!participants || participants.length === 0) return <p className="text-sm text-slate-500">No participants registered.</p>;
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {participants.map((p, i) => (
                <div key={p.id} className="p-3 border rounded bg-slate-50 flex items-center gap-3">
                    <Users size={18} className="text-indigo-500" />
                    <div>
                        <div className="font-semibold text-slate-800">{p.name || p.teamName || `${p.firstName || ''} ${p.lastName || ''}`}</div>
                        <div className="text-xs text-slate-500">ID: {p.id}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Actual Tournament Detail Component
export default function TournamentDetail({ tournament: initialTournament, onClose, onRefresh }) {
    const [t, setT] = useState(initialTournament);
    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(false);

    const load = async (id = t.id) => {
        if (loading) return;
        setLoading(true);
        try {
            // NOTE: Ensure your API URL '/api/tournaments/:id' is correct
            const res = await axios.get(`http://localhost:5000/api/tournaments/${id}`);
            setT(res.data);
            onRefresh && onRefresh(); // Refresh the parent list view
        } catch (err) {
            console.error("Failed to load tournament detail", err);
        } finally {
            setLoading(false);
        }
    };

    // Keep data fresh
    useEffect(() => {
        setT(initialTournament);
        const interval = setInterval(() => load(initialTournament.id), 15000); // Poll every 15s
        return () => clearInterval(interval);
        // eslint-disable-next-line
    }, [initialTournament.id]);

    const liveFixture = (t.events || []).flatMap(ev => ev.fixtures || []).find(f => f.status === "Live") || null;

    if (!t) return <div className="p-6 text-center">Tournament not found.</div>;

    const tabs = ["overview", "participants", "schedule", "live", "standings", "gallery", "settings"];

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-0 md:p-6">
            <div className="bg-slate-900 w-full md:w-[95%] max-w-7xl rounded-none md:rounded-2xl shadow-2xl overflow-auto max-h-screen md:max-h-[94vh] text-white">
                
                {/* Header (Matching Screenshot 2025-12-10 222445.jpg styling) */}
                <div className="sticky top-0 z-20">
                    <div className="h-64 relative bg-green-900/40" style={{ backgroundImage: `url(${t.banner || '/path/to/default/banner-dark.jpg'})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm p-6 flex flex-col justify-end">
                            <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full">
                                <ArrowLeft size={24} className="text-white" />
                            </button>
                            <h1 className="text-4xl font-extrabold">{t.name}</h1>
                            <p className="text-lg font-medium text-slate-300">{t.sportType} | {t.eventMaster}</p>
                            <div className="mt-2 text-sm text-yellow-300">{t.status === "Published" ? "Live Tournament" : t.status}</div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="bg-slate-800 border-b border-slate-700 py-3 px-6 flex overflow-x-auto gap-6">
                        {tabs.map(tb => (
                            <button key={tb} onClick={() => setTab(tb)} className={`px-2 py-1 text-sm font-semibold whitespace-nowrap border-b-2 transition ${tab===tb ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-white"}`}>
                                {tb.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                    {/* OVERVIEW */}
                    {tab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-2xl font-bold border-b border-slate-700 pb-2">Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailCard icon={<Calendar />} label="Start Date" value={t.startDate} />
                                    <DetailCard icon={<Calendar />} label="End Date" value={t.endDate} />
                                    <DetailCard icon={<MapPin />} label="Venue" value={t.venue} />
                                    <DetailCard icon={<Users />} label="Total Participants" value={(t.events || []).flatMap(e => e.participants || []).length} />
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-xl font-semibold">Description</h4>
                                    <p className="text-slate-400 mt-2">{t.description || "No description provided."}</p>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-xl font-semibold border-b border-slate-700 pb-2">Events</h4>
                                    {(t.events || []).map((ev, i) => (
                                        <div key={ev.id} className="p-3 border border-slate-700 rounded mb-2 hover:bg-slate-800">
                                            <div className="font-semibold text-indigo-400">{ev.label || ev.sportName || `Event ${i+1}`}</div>
                                            <div className="text-xs text-slate-500">{ev.format} • {ev.type} • {(ev.participants||[]).length} participants • {(ev.fixtures||[]).length} matches</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <h3 className="text-2xl font-bold border-b border-slate-700 pb-2 mb-4">Live Alert</h3>
                                {liveFixture ? (
                                    <div className="p-4 bg-red-800/50 border border-red-700 rounded-lg shadow-lg">
                                        <div className="text-sm font-bold flex items-center gap-2 mb-2"><Clock size={16} /> MATCH LIVE NOW</div>
                                        <div className="text-xl font-extrabold">{liveFixture.teamA?.name || 'TBD'} vs {liveFixture.teamB?.name || 'TBD'}</div>
                                        <div className="text-2xl font-bold mt-1">{liveFixture.score?.a ?? 0} - {liveFixture.score?.b ?? 0}</div>
                                        <p className="text-xs mt-2 text-red-300">Court: {liveFixture.court} | Event: {liveFixture.eventLabel}</p>
                                        <button onClick={() => setTab("live")} className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm">Go to Live Scoring</button>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-700 rounded-lg text-slate-400">No match currently live.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PARTICIPANTS */}
                    {tab === "participants" && (
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Participants</h3>
                            {(t.events || []).map((ev, i) => (
                                <div key={ev.id} className="bg-slate-800 p-4 rounded-lg mb-6 shadow">
                                    <h4 className="text-xl font-semibold text-indigo-400 mb-3">{ev.label || ev.sportName || `Event ${i+1}`}</h4>
                                    <ParticipantsList participants={ev.participants} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SCHEDULE */}
                    {tab === "schedule" && (
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Schedule & Fixtures</h3>
                            {(t.events || []).map((ev, evIdx) => (
                                <div key={ev.id} className="bg-slate-800 p-4 rounded-lg mb-6 shadow">
                                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                                        <h4 className="text-xl font-semibold text-indigo-400">{ev.label || ev.sportName || `Event ${evIdx+1}`} ({ev.format})</h4>
                                        {ev.format === "Knockout" && <button className="text-sm text-yellow-500 hover:underline" onClick={() => { /* View full bracket */ }}>View Bracket</button>}
                                    </div>

                                    {/* Knockout Diagram */}
                                    {ev.format === "Knockout" && (
                                        <div className="mb-6">
                                            <KnockoutBracket event={ev} />
                                        </div>
                                    )}

                                    {/* Fixture List (Professional look from Screenshot 2025-12-10 222547.png idea) */}
                                    <div className="space-y-3">
                                        {(ev.fixtures || []).map(f => (
                                            <FixtureRow key={f.id} f={f} onClick={() => { setTab("live"); }} />
                                        ))}
                                        {(ev.fixtures || []).length === 0 && <p className="text-sm text-slate-500">No fixtures scheduled.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* LIVE SCORING */}
                    {tab === "live" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <h3 className="text-2xl font-bold mb-4">Live Scoring Editor</h3>
                                {/* The LiveScoring component handles the Padel logic and general score management */}
                                <LiveScoring 
                                    tournament={t} 
                                    onUpdate={() => load(t.id)} 
                                    sportType={t.sportType}
                                    initialFixture={liveFixture}
                                />
                            </div>
                            <div className="lg:col-span-1">
                                <h3 className="text-2xl font-bold mb-4">Match List</h3>
                                {/* Simple list to select a match to score */}
                                <div className="bg-slate-800 p-3 rounded-lg max-h-[60vh] overflow-y-auto">
                                    {(t.events || []).flatMap((ev, evIdx) => (ev.fixtures || []).map(f => ({ ...f, eventLabel: ev.label || ev.sportName, evIdx }))).map(f => (
                                        <div key={f.id} className="p-3 border-b border-slate-700 flex justify-between items-center hover:bg-slate-700 cursor-pointer" onClick={() => { /* In a real app, you'd pass this to LiveScoring as prop */ }}>
                                            <div>
                                                <div className="font-medium">{f.teamA?.name || 'TBD'} vs {f.teamB?.name || 'TBD'}</div>
                                                <div className="text-xs text-slate-500">{f.eventLabel} | {f.status}</div>
                                            </div>
                                            <div className="font-bold text-lg">{f.score?.a ?? '—'} - {f.score?.b ?? '—'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STANDINGS */}
                    {tab === "standings" && (
                        <div>
                            <h3 className="text-2xl font-bold mb-4">Standings</h3>
                            {(t.events || []).map((ev, i) => (
                                <div key={ev.id} className="bg-slate-800 p-4 rounded-lg mb-6 shadow">
                                    <h4 className="text-xl font-semibold text-indigo-400 mb-3">{ev.label || ev.sportName || `Event ${i+1}`}</h4>
                                    <StandingsTable event={ev} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Gallery, Settings tabs (placeholders) */}
                    {["gallery", "settings"].includes(tab) && (
                        <div className="p-10 bg-slate-800 rounded-lg text-center text-slate-500">
                            {tab.toUpperCase()} Content Coming Soon.
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// Helper Components for Details View

function DetailCard({ icon, label, value }) {
    return (
        <div className="p-4 bg-slate-800 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-full text-white">{icon}</div>
            <div>
                <div className="text-sm text-slate-400">{label}</div>
                <div className="font-semibold text-white">{value}</div>
            </div>
        </div>
    );
}

function FixtureRow({ f, onClick }) {
    // Style mimicking Screenshot 2025-12-10 222547.png
    const date = f.scheduledAt ? new Date(f.scheduledAt) : null;
    const isCompleted = f.status === "Completed";
    const isLive = f.status === "Live";
    
    // Determine the result status text
    let statusText = f.status;
    let statusColor = 'text-slate-400';
    if (isCompleted) {
        statusText = 'Completed';
        statusColor = 'text-green-500';
    } else if (isLive) {
        statusText = 'LIVE';
        statusColor = 'text-red-500 font-bold';
    }

    return (
        <div className={`p-4 rounded-lg border border-slate-700 shadow-md ${isLive ? 'bg-slate-700/80 border-red-500' : 'bg-slate-800'} transition hover:bg-slate-700/50 cursor-pointer`} onClick={onClick}>
            <div className="grid grid-cols-12 items-center">
                {/* Date/Time */}
                <div className="col-span-3 md:col-span-2 text-center border-r border-slate-700 pr-3">
                    <div className="text-sm font-bold text-indigo-400">{date ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'TBD'}</div>
                    <div className="text-xs text-slate-500">{date ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}</div>
                </div>

                {/* Teams and Score */}
                <div className="col-span-7 md:col-span-8 flex justify-between items-center px-4">
                    <div className="text-right">
                        <div className="font-bold text-lg text-indigo-300">{f.teamA?.name || 'Player A TBD'}</div>
                        <div className="text-xs text-slate-400">Round {f.round || 1}</div>
                    </div>

                    <div className="text-center mx-4">
                        <div className={`text-3xl font-extrabold ${isCompleted ? 'text-white' : 'text-slate-400'}`}>
                            {isCompleted || isLive ? `${f.score?.a || 0} - ${f.score?.b || 0}` : 'VS'}
                        </div>
                        <div className={`text-xs ${statusColor}`}>{statusText}</div>
                    </div>

                    <div className="text-left">
                        <div className="font-bold text-lg text-red-300">{f.teamB?.name || 'Player B TBD'}</div>
                        <div className="text-xs text-slate-400">Court {f.court || '-'}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="col-span-2 md:col-span-2 text-right">
                    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700">Manage</button>
                </div>
            </div>
        </div>
    );
}

// Exporting the necessary components (StandingsTable, KnockoutBracket) in case they are needed in other files
export { StandingsTable, KnockoutBracket, LiveScoring };