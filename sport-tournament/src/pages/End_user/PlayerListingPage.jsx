import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Search, ChevronRight, ArrowLeft } from "lucide-react";

// Base URL for your API
const API_BASE = "http://localhost:5000/api";

/**
 * PlayerListingPage Component
 * Fetches and displays a list of all registered players with search functionality.
 * Provides links to the detailed PlayerProfilePage.
 */
export default function PlayerListingPage() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Data Fetching Logic ---
    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            setError(null);
            try {
                // IMPORTANT: This endpoint must be implemented on your backend
                // to return an array of ALL players.
                const res = await fetch(`${API_BASE}/players`); 
                
                if (!res.ok) {
                    throw new Error(`Failed to fetch players. Server status: ${res.status}. 
                        Please ensure the backend endpoint ${API_BASE}/players is running and returning data.`);
                }
                
                const data = await res.json();
                setPlayers(data);
            } catch (err) {
                console.error("Failed to fetch player list:", err);
                setError(err.message || "Could not load player listing.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    // --- Search Filtering Logic ---
    const filteredPlayers = players.filter(player =>
        // Assumes player objects have firstName and lastName properties
        (player.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Loading State ---
    if (loading) {
        return (
            <div className="p-10 text-center text-xl text-indigo-600">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-indigo-500 border-gray-200 rounded-full"></div>
                <p className="mt-4">Loading Players Directory...</p>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="p-10 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-2xl">API Error</p>
                <p className="text-lg mt-2">{error}</p>
            </div>
        );
    }

    // --- Rendered Component ---
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="mb-6">
                <Link 
                    to="/user/event_listing" 
                    className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Events
                </Link>
            </div>

            <div className="bg-white shadow-xl rounded-lg p-6 mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-4 flex items-center border-b pb-2">
                    <Users className="w-6 h-6 mr-3 text-indigo-600" />
                    Registered Players Directory ({players.length})
                </h1>

                {/* Search Bar */}
                <div className="mb-6 flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <Search className="w-5 h-5 text-gray-500 ml-4" />
                    <input
                        type="text"
                        placeholder="Search player by name..."
                        className="w-full px-4 py-3 bg-transparent text-gray-800 focus:outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Player List */}
                <div className="space-y-3">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map(player => (
                            <PlayerListItem key={player.id} player={player} />
                        ))
                    ) : (
                        <p className="text-gray-500 italic p-4 text-center">
                            {searchTerm ? "No players match your search." : "No players are currently registered."}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * PlayerListItem Component
 * Displays a single player's summary and a link to their profile page.
 */
const PlayerListItem = ({ player }) => (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition duration-150 flex justify-between items-center border border-gray-100">
        <div className="flex items-center">
            <img
                // Use a placeholder if the photo URL is empty
                src={player.photo || 'https://via.placeholder.com/50/4f46e5/ffffff?text=P'}
                alt={`${player.firstName} photo`}
                className="w-10 h-10 rounded-full object-cover mr-4 border-2 border-indigo-100"
            />
            <div>
                <h3 className="text-lg font-semibold text-gray-900">
                    {player.firstName} {player.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                    {player.gender || 'N/A'} | {player.email || 'No email'}
                </p>
            </div>
        </div>
        <Link 
            // Link to the dynamic player profile page
            to={`/user/players/${player.id}`} 
            className="text-indigo-600 hover:text-indigo-800 flex items-center font-medium whitespace-nowrap"
        >
            View Profile <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
    </div>
);