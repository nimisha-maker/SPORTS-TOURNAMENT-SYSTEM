import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Star,
    Zap,
    Clock,
    Calendar,
    MapPin,
    Trophy,
    Share2,
    Activity,
    ShieldCheck,
    ChevronRight
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/tournaments";

const getYouTubeID = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export default function LiveMatchPage() {
    const { eventId, matchId } = useParams();
    const [tournament, setTournament] = useState(null);
    const [match, setMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatchDetails = async () => {
            try {
                const res = await fetch(`${API_BASE}/${eventId}`);
                if (!res.ok) throw new Error("Failed to fetch match data");
                const data = await res.json();
                setTournament(data);

                let foundMatch = null;
                for (const event of data.events || []) {
                    const fixture = (event.fixtures || []).find((f) => f.id === matchId);
                    if (fixture) {
                        foundMatch = { ...fixture, eventName: event.label };
                        break;
                    }
                }
                if (!foundMatch) throw new Error("Match not found");
                setMatch(foundMatch);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchMatchDetails();
    }, [eventId, matchId]);

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
            <Activity className="text-indigo-500 animate-pulse mb-4" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Initializing Pro Stream</p>
        </div>
    );

    if (error) return <div className="p-10 text-center text-red-500 font-bold">{error}</div>;

    const isLive = match.status === "Live";

    return (
        <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans">
            {/* --- PROFESSIONAL TOP BAR --- */}
            <nav className="bg-white/70 backdrop-blur-xl sticky top-0 z-100 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to={`/user/event_listing`} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all">
                            <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest hidden sm:block">Exit Court</span>
                        </Link>
                        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                        <div>
                            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">{tournament?.name}</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase mt-1 tracking-wider">{match.eventName} • {match.round}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 transition-colors">
                            <Share2 size={14} /> Share
                        </button>
                        {isLive && (
                            <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Live Pro</span>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-[1400px] mx-auto px-6 py-8">
                {isLive ? (
                    <ProfessionalLiveView match={match} tournament={tournament} />
                ) : (
                    <ProfessionalScheduledView match={match} tournament={tournament} />
                )}
            </main>
        </div>
    );
}

/* --- PROFESSIONAL LIVE VIEW (Broadcast Style) --- */
function ProfessionalLiveView({ match, tournament }) {
    const videoId = getYouTubeID(match.streamUrl || match.videoUrl);

    return (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Video Feed */}
            <div className="lg:col-span-8">
                <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border-[6px] border-white ring-1 ring-slate-200 aspect-video relative group">
                    {videoId ? (
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&modestbranding=1&showinfo=0&rel=0`}
                            title="Pro Stream"
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-slate-800 to-slate-900">
                            <Trophy size={64} className="text-slate-700 mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Waiting for Video Signal</p>
                        </div>
                    )}
                </div>

                {/* Match Summary Bar */}
                <div className="mt-8 bg-white rounded-4xl p-8 shadow-sm border border-slate-200/60 flex flex-wrap justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl"><MapPin className="text-indigo-600" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue Location</p>
                            <p className="font-bold text-slate-800">{tournament?.venue || "Main Stadium"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-4 rounded-2xl"><ShieldCheck className="text-indigo-600" size={24} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Type</p>
                            <p className="font-bold text-slate-800">Official Tournament</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Data Sidebar */}
            <div className="lg:col-span-4 space-y-6">
                <ProScoreCard match={match} />
                
                <div className="bg-linear-to-br from-indigo-600 to-blue-700 rounded-4xl p-6 text-white shadow-lg shadow-indigo-200">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-4">Official Notice</h4>
                    <p className="text-sm font-medium leading-relaxed">Please follow the fair play guidelines. Scores are updated every 30 seconds.</p>
                </div>
            </div>
        </div>
    );
}

/* --- PROFESSIONAL SCHEDULED VIEW (Editorial Style) --- */
function ProfessionalScheduledView({ match, tournament }) {
    const matchTime = match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "TBD";
    const matchDate = match.scheduledAt ? new Date(match.scheduledAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : "Date TBD";

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-[50px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-200/60">
                {/* Header Section */}
                <div className="px-12 py-16 bg-linear-to-b from-slate-50 to-white text-center border-b border-slate-100">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full mb-8">
                        <Clock className="text-indigo-600" size={14} />
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Scheduled Kickoff</span>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-around gap-12">
                        <div className="flex-1">
                            <div className="w-32 h-32 bg-white rounded-[40px] shadow-xl border border-slate-100 mx-auto mb-6 flex items-center justify-center">
                                <span className="text-4xl font-black text-slate-900 uppercase">{match.teamA?.name?.charAt(0)}</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase leading-tight">{match.teamA?.name || "Team A"}</h2>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="text-5xl font-black text-slate-200 mb-2 uppercase">VS</div>
                            <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
                        </div>

                        <div className="flex-1">
                            <div className="w-32 h-32 bg-white rounded-[40px] shadow-xl border border-slate-100 mx-auto mb-6 flex items-center justify-center">
                                <span className="text-4xl font-black text-slate-900 uppercase">{match.teamB?.name?.charAt(0)}</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase leading-tight">{match.teamB?.name || "Team B"}</h2>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-10 flex flex-col items-center text-center">
                        <Calendar className="text-indigo-500 mb-4" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Event Date</p>
                        <p className="font-bold text-slate-800">{matchDate}</p>
                    </div>
                    <div className="p-10 flex flex-col items-center text-center">
                        <Clock className="text-indigo-500 mb-4" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Starting At</p>
                        <p className="text-2xl font-black text-indigo-600">{matchTime}</p>
                    </div>
                    <div className="p-10 flex flex-col items-center text-center">
                        <MapPin className="text-indigo-500 mb-4" size={32} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Arena Venue</p>
                        <p className="font-bold text-slate-800">{tournament?.venue || "Main Court"}</p>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 flex justify-center">
                <button className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-indigo-600 transition-all">
                    Set Match Reminder <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

/* --- PRO SCORECARD COMPONENT (Dynamic Sidebar) --- */
function ProScoreCard({ match }) {
    const score = match.score || {};
    const sets = score.sets || [];
    
    return (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-200/60 overflow-hidden">
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between">
                <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Match Dashboard</h3>
                <div className="px-3 py-1 bg-red-600 rounded-lg text-[8px] font-black text-white uppercase animate-pulse">Live Stats</div>
            </div>

            <div className="p-8 space-y-6">
                {/* Team Rows */}
                {[
                    { name: match.teamA?.name, points: score.pointsA, games: score.gamesA },
                    { name: match.teamB?.name, points: score.pointsB, games: score.gamesB }
                ].map((team, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-10 bg-slate-100 group-hover:bg-indigo-500 transition-colors rounded-full"></div>
                            <span className="text-lg font-black text-slate-900 uppercase leading-none">{team.name}</span>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">S: {team.games || 0}</span>
                            <span className="text-4xl font-black text-indigo-600 tracking-tighter w-12 text-right">{team.points || 0}</span>
                        </div>
                    </div>
                ))}

                {/* Set Results */}
                {sets.length > 0 && (
                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Set Results History</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {sets.map((s, i) => (
                                <div key={i} className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">S{i+1}</span>
                                    <span className="text-[10px] font-black text-slate-900">{s.a} - {s.b}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}