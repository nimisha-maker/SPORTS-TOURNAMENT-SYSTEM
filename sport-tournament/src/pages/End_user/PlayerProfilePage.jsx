import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    User, Calendar, Mail, Phone, Trophy, History, ArrowLeft, 
    Swords, CheckCircle, XCircle, Percent 
} from 'lucide-react';

// API Base
const API_BASE = "http://localhost:5000/api";

const initialPlayerState = {
    id: null,
    firstName: "Player",
    lastName: "Loading",
    gender: "TBD",
    dob: null,
    email: "N/A",
    mobile: "N/A",
    status: "Active",
    photo: "",
};

/**
 * PlayerProfilePage Component (Detailed Single Player View)
 * Fetches and displays a specific player's public details, calculated statistics, and match history.
 * This is mounted at the dynamic route: /user/players/:playerId
 */
export default function PlayerProfilePage() {
    // Get playerId from the route parameter
    const { playerId } = useParams(); 
    const [player, setPlayer] = useState(initialPlayerState);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Data Fetching Logic ---
    useEffect(() => {
        if (!playerId) {
            setLoading(false);
            setError("No Player ID provided in the URL.");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Player Basic Details
                const playerRes = await fetch(`${API_BASE}/players/${playerId}`);
                if (playerRes.status === 404) throw new Error("Player not found.");
                if (!playerRes.ok) throw new Error("Failed to fetch player details.");
                const playerData = await playerRes.json();
                setPlayer(playerData);

                // 2. Fetch Player Match History/Stats
                const historyRes = await fetch(`${API_BASE}/players/${playerId}/history`);
                if (historyRes.status === 404) {
                    setHistory([]); // It's okay if they have no history yet
                } else if (!historyRes.ok) {
                    throw new Error("Failed to fetch match history.");
                } else {
                    const historyData = await historyRes.json();
                    setHistory(historyData); 
                }

            } catch (err) {
                console.error("Error fetching player data:", err);
                setError(err.message || "Could not load player profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [playerId]);

    // --- Statistics Calculation (Derived State) ---
    const playerStats = useMemo(() => {
        const totalMatches = history.length;
        if (totalMatches === 0) {
            return { totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: 0 };
        }

        // Calculate basic stats from the history array
        const wins = history.filter(item => item.result === 'Win').length;
        const losses = history.filter(item => item.result === 'Loss').length;
        const draws = history.filter(item => item.result === 'Draw').length;
        const winRate = ((wins / totalMatches) * 100).toFixed(1);

        return { totalMatches, wins, losses, draws, winRate };
    }, [history]);
    
    // --- Utility Calculation ---
    // 🚨 REMOVED: Age calculation is no longer needed as DOB is not displayed 
    // const age = player.dob ? new Date().getFullYear() - new Date(player.dob).getFullYear() : 'N/A';
    
    // --- Loading and Error States ---
    if (loading) {
        return (
            <div className="p-10 text-center text-xl text-indigo-600">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-indigo-500 border-gray-200 rounded-full"></div>
                <p className="mt-4">Loading Player Profile...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-2xl">Error Loading Profile</p>
                <p className="text-lg mt-2">{error}</p>
            </div>
        );
    }

    // --- Rendered Profile ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="mb-6">
                <Link 
                    // Link back to the player listing page
                    to="/user/player_stats" 
                    className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Player Directory
                </Link>
            </div>

            {/* 1. Player Header Card (Public Details ONLY) */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8 p-6 flex flex-col md:flex-row items-center">
                <img
                    src={player.photo || 'https://via.placeholder.com/150/4f46e5/ffffff?text=P'}
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-200 mb-4 md:mb-0 md:mr-6"
                />
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-1">
                        {player.firstName} {player.lastName}
                    </h1>
                    <p className="text-gray-500 text-lg flex items-center">
                        <User className="w-5 h-5 mr-2 text-indigo-500" />
                        Status: {player.status} | Gender: {player.gender}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-gray-700 text-sm">
                        {/* 🚨 REMOVED: Player PII (DOB, Email, Mobile, Age) for privacy/security */}
                        <p className="flex items-center"><Trophy className="w-4 h-4 mr-1 text-gray-400" /> Player Profile</p>
                    </div>
                </div>
            </div>
            
            {/* 2. Career Statistics Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center border-b pb-2">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" /> Career Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <PlayerStatsCard icon={Swords} title="Total Matches" value={playerStats.totalMatches} color="bg-indigo-100" />
                    <PlayerStatsCard icon={CheckCircle} title="Wins" value={playerStats.wins} color="bg-green-100" />
                    <PlayerStatsCard icon={XCircle} title="Losses" value={playerStats.losses} color="bg-red-100" />
                    <PlayerStatsCard icon={Percent} title="Win Rate" value={`${playerStats.winRate}%`} color="bg-yellow-100" />
                </div>
            </div>

            {/* 3. Match History Section */}
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2 flex items-center">
                    <History className="w-6 h-6 mr-3 text-red-600" />
                    Match History ({history.length} Entries)
                </h2>

                {history.length === 0 ? (
                    <p className="text-gray-500 italic p-4 text-center">
                        This player has no recorded match history yet.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                            <HistoryCard 
                                // Key needs to be unique for each item
                                key={item.matchId || item.id} 
                                item={item} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Reusable component for a single statistic display
const PlayerStatsCard = ({ icon: Icon, title, value, color }) => (
    <div className={`p-4 rounded-lg shadow-md flex items-center ${color}`}>
        <div className={`p-3 rounded-full ${color.replace('-100', '-500')} mr-4`}>
            <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

// Reusable component for a single history entry
const HistoryCard = ({ item }) => {
    // tournamentId and matchId are used for routing, not displayed as text
    const isWinner = item.result === 'Win'; 
    const scorePath = `/user/${item.tournamentId}/scorecard/${item.matchId}`; // Link to the score detail

    return (
        <div className={`p-4 rounded-lg shadow-md transition duration-150 flex justify-between items-center ${isWinner ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
            <div className='flex-1'>
                <p className="text-sm font-medium text-indigo-600 flex items-center mb-1">
                    <Trophy className="w-4 h-4 mr-1" /> {item.tournamentName || 'Unknown Tournament'}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Swords className="w-4 h-4 mr-2" /> 
                    {item.matchDetails || 'Match vs Opponent'}
                </h3>
                <p className={`text-sm mt-1 font-bold ${isWinner ? 'text-green-700' : 'text-red-700'}`}>
                    Result: {item.result || 'Incomplete'}
                </p>
            </div>
            <Link
                to={scorePath}
                className="px-3 py-1.5 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition hover:text-blue-600 whitespace-nowrap"
            >
                View Scorecard
            </Link>
        </div>
    );
};