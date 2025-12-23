import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
    MapPin,
    Calendar,
    Clock,
    Trophy,
    Users,
    Swords,
    Zap,
    ListOrdered,
    ArrowLeft,
} from "lucide-react";

// API Base derived from your TournamentList.jsx
const API_BASE = "http://localhost:5000/api/tournaments";

// Data Structure assumption based on your CreateTournament.jsx
const initialTournamentState = {
    id: null,
    name: "Loading Event...",
    venue: "TBD",
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    description: "",
    banner: "",
    sportType: "Sport",
    events: [], // Array of internal events/fixtures
};

export default function EventDetailsPage() {
    // Get the ID from the URL path: /user/:id
    const { id } = useParams();

    const [tournament, setTournament] = useState(initialTournamentState);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id) return;

        const fetchTournament = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch single tournament details
                const res = await fetch(`${API_BASE}/${id}`);

                if (res.status === 404) {
                    throw new Error("Event not found (ID may be missing in data file).");
                }
                if (!res.ok) {
                    throw new Error("Server error or failed to connect.");
                }

                const data = await res.json();
                setTournament(data);

            } catch (err) {
                console.error("Failed to fetch tournament details:", err);
                setError(err.message || "Could not load event details.");
            } finally {
                setLoading(false);
            }
        };

        fetchTournament();
    }, [id]); // Rerun when the ID changes

    // --- NEW: Memoize the extraction of all currently LIVE fixtures ---
    const liveFixtures = useMemo(() => {
        if (!tournament.events) return [];
        let live = [];
        for (const event of tournament.events) {
            if (event.fixtures) {
                // Filter fixtures that are 'Live' and add event context
                const liveInEvent = event.fixtures
                    .filter(f => f.status === 'Live')
                    .map(f => ({ 
                        ...f, 
                        eventName: event.label, 
                        tournamentId: tournament.id // Attach tournament ID for linking
                    }));
                live = live.concat(liveInEvent);
            }
        }
        return live;
    }, [tournament.events, tournament.id]); // Recalculate if events change


    if (loading) {
        return (
            <div className="p-10 text-center text-xl text-blue-600">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-t-blue-500 border-gray-200 rounded-full"></div>
                <p className="mt-4">Loading Event Details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-semibold text-2xl">Error Loading Event</p>
                <p className="text-lg mt-2">{error}</p>
                {/* ID removed from user-facing error message */}
                <p className="text-sm mt-4">Make sure your backend server is running and the tournament data is available.</p> 
            </div>
        );
    }

    // Helper function to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Helper to count all participants across all internal events
    const totalParticipants = tournament.events.reduce((total, event) => {
        return total + (event.participants?.length || 0);
    }, 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="mb-6">
                <Link 
                    to="/user/event_listing" 
                    className="text-blue-600 hover:text-blue-800 flex items-center font-medium transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Event Listing
                </Link>
            </div>

            {/* --- LIVE MATCH ALERT SECTION --- */}
            <LiveMatchAlert liveFixtures={liveFixtures} />

            {/* Banner and Header */}
            <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
                {tournament.banner ? (
                    <img
                        src={tournament.banner}
                        alt={`${tournament.name} Banner`}
                        className="w-full h-48 object-cover"
                    />
                ) : (
                    <div className="w-full h-48 bg-blue-600/10 flex items-center justify-center">
                        <h2 className="text-3xl text-blue-800 font-bold">{tournament.name}</h2>
                    </div>
                )}
                <div className="p-6">
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                        {tournament.name}
                    </h1>
                    <p className="text-gray-500 flex items-center mb-4">
                        <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                        {tournament.sportType}
                    </p>
                    <p className="text-gray-700 text-lg">{tournament.description || "No description provided."}</p>
                </div>
            </div>

            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <DetailCard
                    icon={MapPin}
                    title="Venue"
                    value={tournament.venue || "To be announced"}
                />
                <DetailCard
                    icon={Calendar}
                    title="Dates"
                    value={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
                />
                <DetailCard
                    icon={Users}
                    title="Total Participants"
                    value={`${totalParticipants} Registered`}
                />
            </div>

            {/* Fixtures/Schedule Section */}
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2 flex items-center">
                    <Swords className="w-6 h-6 mr-3 text-red-600" />
                    Fixtures & Schedule
                </h2>

                {tournament.events.length === 0 ? (
                    <p className="text-gray-500 italic">No events or schedule published yet.</p>
                ) : (
                    <div className="space-y-8">
                        {tournament.events.map((event) => (
                            <EventScheduleBlock key={event.id} event={event} tournamentId={id} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

// --- Global Live Match Alert ---
const LiveMatchAlert = ({ liveFixtures }) => {
    if (liveFixtures.length === 0) return null;

    return (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-600 text-red-800 rounded-lg shadow-md animate-pulse">
            <h3 className="text-xl font-bold flex items-center">
                <Zap className="w-5 h-5 mr-2 fill-red-600" /> 
                {liveFixtures.length} Match{liveFixtures.length > 1 ? 'es' : ''} Live Now!
            </h3>
            <div className="mt-2 space-y-2">
                {liveFixtures.map((f, index) => (
                    <Link
                        key={index}
                        to={`/user/${f.tournamentId}/live/${f.id}`}
                        className="block text-red-700 hover:text-red-900 hover:underline transition duration-150 text-sm font-medium"
                    >
                        &bull; {f.eventName} - {f.teamA?.name || 'Team A'} vs {f.teamB?.name || 'Team B'} ({f.round})
                    </Link>
                ))}
            </div>
        </div>
    );
};


// Reusable component for displaying key details
const DetailCard = ({ icon: Icon, title, value }) => (
    <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
        <div className="flex items-center">
            <Icon className="w-6 h-6 text-blue-500 mr-3" />
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-lg font-semibold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);

// Component to handle nested internal events (WOMEN'S, MEN'S, etc.)
const EventScheduleBlock = ({ event, tournamentId }) => {

    if (!event.fixtures || event.fixtures.length === 0) {
        return (
            <div className="border border-gray-100 rounded-lg p-4 bg-slate-50">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.label}</h3>
                <p className="text-gray-500 italic">No fixtures generated for this event yet.</p>
            </div>
        );
    }
    
    // --- Implement Custom Sorting for Fixtures (Live first) ---
    const sortedFixtures = [...event.fixtures].sort((a, b) => {
        const statusOrder = { 'Live': 3, 'Scheduled': 2, 'Completed': 1, 'TBD': 0 };
        
        const statusA = statusOrder[a.status] || 0;
        const statusB = statusOrder[b.status] || 0;

        // 1. Prioritize status: Live > Scheduled > Completed
        if (statusA !== statusB) {
            return statusB - statusA;
        }

        // 2. Secondary sort: Use scheduled time for scheduled matches
        if (a.scheduledAt && b.scheduledAt) {
            return new Date(a.scheduledAt) - new Date(b.scheduledAt);
        }
        
        return 0;
    });
    // --- END Sorting ---

    return (
        <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-inner">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center">
                <ListOrdered className="w-5 h-5 mr-2 text-indigo-600" />
                {event.label} ({event.type} - {event.format})
            </h3>

            <div className="space-y-4">
                {/* Loop through the sorted matches */}
                {sortedFixtures.map((fixture) => (
                    <FixtureCard
                        key={fixture.id}
                        fixture={fixture}
                        tournamentId={tournamentId}
                    />
                ))}
            </div>
        </div>
    );
};


// Reusable component for displaying an internal fixture/match
const FixtureCard = ({ fixture, tournamentId }) => {

    // Use team names from the fixture object
    const teamA = fixture.teamA?.name || 'Team A';
    const teamB = fixture.teamB?.name || 'Team B';
    const matchId = fixture.id; 
    const status = fixture.status || 'Scheduled'; // Default status
    const isLive = status === 'Live';

    const renderActionButton = () => {
        // 1. COMPLETED MATCH (Links to Scorecard Page)
        if (status === 'Completed') {
            return (
                <Link
                    to={`/user/${tournamentId}/scorecard/${matchId}`}
                    className="px-3 py-1.5 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition hover:text-blue-600"
                >
                    Scorecard
                </Link>
            );
        }

        // 2. LIVE / SCHEDULED MATCHES (Links to Live Match Page)
        
        // Define the variables for the Link component
        const buttonText = isLive ? 'View Live' : 'View Schedule';
        const buttonStyle = isLive 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-green-500 text-white hover:bg-green-600';

        const icon = isLive 
            ? <Zap className="w-4 h-4 mr-1 fill-white" /> 
            : <Clock className="w-4 h-4 mr-1" />;

        // This is the correct dynamic link to LiveMatchPage
        return (
            <Link
                to={`/user/${tournamentId}/live/${matchId}`} 
                className={`px-3 py-1.5 text-sm rounded-md transition flex items-center ${buttonStyle}`}
            >
                {icon} {buttonText}
            </Link>
        );
    };
    
    // 🚨 FIX APPLIED HERE: Ensure the template literal for className is clean
    return (
        <div className={`
            border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row 
            justify-between items-start sm:items-center bg-gray-50 hover:bg-white 
            transition duration-150 relative 
            ${isLive ? 'shadow-lg border-l-4 border-red-500 bg-red-50' : ''} 
        `}>

            {/* Match Info */}
            <div className="flex-1 mb-3 sm:mb-0">
                <p className="text-sm font-medium text-gray-500">{fixture.round || 'Round 1'}</p>
                <h3 className="text-xl font-bold text-gray-900">
                    {teamA} <span className="text-red-500 mx-2 font-normal">vs</span> {teamB}
                </h3>
                <p className="text-gray-600 text-sm flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1.5" />
                    Court {fixture.court || 'TBD'} | 
                    {fixture.scheduledAt ? ` ${new Date(fixture.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' Time TBD'}
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
                {renderActionButton()}
            </div>
        </div>
    );
};