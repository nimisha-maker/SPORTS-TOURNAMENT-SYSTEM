import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, Swords, Percent, ChevronDown } from 'lucide-react';

const API_BASE = "http://localhost:5000/api";

/**
 * Helper component for displaying a single standings metric
 */
const StatCard = ({ title, value, colorClass, icon: Icon }) => (
    <div className={`p-4 rounded-lg shadow-md flex items-center ${colorClass} bg-opacity-70`}>
        <div className="p-3 bg-white rounded-full mr-4 shadow-inner">
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);


/**
 * StandingsPage Component
 * Fetches and displays leaderboards based on selected tournament and event.
 */
export default function StandingsPage() {
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Fetch Tournaments (for the dropdown selectors) ---
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch(`${API_BASE}/tournaments/all`);
                const data = await res.json();
                setTournaments(data);
                
                // Auto-select the first available tournament and event upon load
                if (data.length > 0) {
                    setSelectedTournamentId(String(data[0].id));
                    if (data[0].events && data[0].events.length > 0) {
                        setSelectedEventId(data[0].events[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tournaments:", err);
                setError("Could not load tournament list.");
            } finally {
                setLoading(false);
            }
        };
        fetchTournaments();
    }, []);

    // --- Fetch Standings (runs whenever tournament/event selection changes) ---
    useEffect(() => {
        if (!selectedTournamentId || !selectedEventId) {
            setStandings([]);
            return;
        }

        const fetchStandings = async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${API_BASE}/tournaments/${selectedTournamentId}/events/${selectedEventId}/standings`;
                const res = await fetch(url);
                
                if (res.status === 404) {
                    setStandings([]);
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch standings data.");
                
                const data = await res.json();
                setStandings(data);
            } catch (err) {
                console.error("Error fetching standings:", err);
                setError(err.message || "Failed to load rankings for this event.");
            } finally {
                setLoading(false);
            }
        };

        fetchStandings();
    }, [selectedTournamentId, selectedEventId]);

    // --- Derived State for the currently selected tournament object ---
    const currentTournament = useMemo(() => {
        return tournaments.find(t => String(t.id) === selectedTournamentId);
    }, [tournaments, selectedTournamentId]);

    const currentEvent = useMemo(() => {
        return currentTournament?.events.find(e => e.id === selectedEventId);
    }, [currentTournament, selectedEventId]);

    // --- Statistics Summary (Top Rank) ---
    const topPlayer = standings[0];
    const topStats = useMemo(() => {
        if (!topPlayer) return { wins: 0, winRate: 0, points: 0 };
        return {
            wins: topPlayer.wins,
            winRate: topPlayer.winRate,
            points: topPlayer.points
        };
    }, [topPlayer]);


    if (loading && tournaments.length === 0) {
        return <div className="p-8 text-center text-indigo-600">Loading Tournaments...</div>;
    }

    if (error && tournaments.length === 0) {
        return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    }
    
    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <Trophy className="w-8 h-8 mr-3 text-yellow-600" /> Event Standings
            </h1>

            {/* Selector Row */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tournament Selector */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Tournament</label>
                    <select
                        value={selectedTournamentId}
                        onChange={(e) => {
                            const newTid = e.target.value;
                            setSelectedTournamentId(newTid);
                            
                            // Reset Event ID when tournament changes
                            const t = tournaments.find(t => String(t.id) === newTid);
                            if (t && t.events.length > 0) {
                                setSelectedEventId(t.events[0].id);
                            } else {
                                setSelectedEventId('');
                            }
                        }}
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                    >
                        <option value="">-- Select Tournament --</option>
                        {tournaments.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Event Selector */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Event</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        disabled={!currentTournament || currentTournament.events.length === 0}
                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 appearance-none disabled:bg-gray-100"
                    >
                        <option value="">-- Select Event --</option>
                        {currentTournament?.events.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.label} ({e.type})
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Statistics Summary Cards */}
            {selectedEventId && (
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Event Summary: {currentEvent?.label || 'Loading...'}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon={Trophy} title="Leading Player Points" value={topStats.points} colorClass="bg-yellow-100" />
                        <StatCard icon={Swords} title="Leading Player Wins" value={topStats.wins} colorClass="bg-indigo-100" />
                        <StatCard icon={Percent} title="Top Win Rate" value={`${topStats.winRate}%`} colorClass="bg-green-100" />
                    </div>
                </div>
            )}

            {/* Standings Table */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                           <div className="p-8 text-center text-indigo-600">Loading Standings...</div>
                    ) : error ? (
                           <div className="p-8 text-center text-red-600">Error: {error}</div>
                    ) : standings.length === 0 ? (
                        <p className="p-8 text-center text-gray-500">
                            {selectedEventId ? "No standings found or no matches completed for this event." : "Please select a Tournament and Event to view standings."}
                        </p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* 🚨 MODIFICATION: Apply min-w-[10rem] to 'Participant' header */}
                                    {['Rank', 'Participant', 'Matches', 'Wins', 'Losses', 'Draws', 'Win Rate (%)', 'Pts', 'PD'].map(header => (
                                        <th 
                                            key={header} 
                                            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${header === 'Participant' ? 'min-w-40' : ''}`}
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {standings.map((p) => (
                                    <tr key={p.id} className={p.rank === 1 ? 'bg-yellow-50 font-semibold' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.rank}</td>
                                        
                                        {/* 🚨 MODIFICATION: Removed whitespace-nowrap to allow text wrapping, added min-width */}
                                        <td className="px-6 py-4 text-sm text-gray-900 min-w-40">
                                            {p.name}
                                        </td>

                                        {/* The remaining columns retain whitespace-nowrap for alignment of numbers */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.totalMatches}</td> {/* Matches */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{p.wins}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{p.losses}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.draws}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.winRate}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{p.points}</td> {/* Pts */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.pointDifference}</td> {/* PD */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}