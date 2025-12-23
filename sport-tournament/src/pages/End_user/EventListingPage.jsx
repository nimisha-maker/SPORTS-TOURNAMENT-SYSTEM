import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Calendar, Trophy, Zap, List } from "lucide-react";

// API Base derived from your TournamentList.jsx
const API_BASE = "http://localhost:5000/api/tournaments";

export default function EventListingPage() {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                // Fetch all tournaments for the listing page
                const res = await fetch(`${API_BASE}/all`);
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();
                
                // Filter: Only show events that are explicitly marked as 'Published' 
                // or 'Live' to the end-user. (We keep this filter)
                const publishedTournaments = data.filter(
                    (t) => t.status === "Published" || t.status === "Live"
                );
                
                setTournaments(publishedTournaments);
            } catch (err) {
                console.error("Failed to fetch events:", err);
                setError("Could not load events. Please check the backend server status.");
            } finally {
                setLoading(false);
            }
            // Note: The rest of the EventListingPage component remains unchanged
        };

        fetchTournaments();
    }, []);

    if (loading) {
        return (
            <div className="p-10 text-center text-xl text-blue-600">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full"></div>
                <p className="mt-4">Loading upcoming events...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold">{error}</p>
                <p className="text-sm mt-2">Check the console for API details.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8 min-h-screen bg-gray-50">
            
            {/* Header */}
            <div className="mb-8 border-b pb-4">
                <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                    <List className="w-8 h-8 mr-3 text-blue-600" />
                    All Tournaments
                </h1>
            </div>

            {/* Event Cards Grid */}
            {tournaments.length === 0 ? (
                <div className="text-center p-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">No published events found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {tournaments.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper component for a single event card
const EventCard = ({ event }) => {
    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <Link to={`/user/${event.id}`} className="block">
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                
                {/* Banner Image */}
                <div className="relative">
                    {event.banner ? (
                        <img
                            src={event.banner}
                            alt={event.name}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-600">
                            No Image
                        </div>
                    )}
                    
                    {/* 🚨 THE STATUS BADGE CODE IS REMOVED HERE 🚨 */}
                    
                </div>
                
                {/* Card Content */}
                <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {event.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                        <Trophy className="w-4 h-4 mr-1 text-gray-400" />
                        {event.sportType}
                    </p>
                    
                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                            {formatDate(event.startDate)} - {formatDate(event.endDate)}
                        </p>
                        <p className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                            {event.venue}
                        </p>
                    </div>
                </div>
            </div>
        </Link>
    );
};