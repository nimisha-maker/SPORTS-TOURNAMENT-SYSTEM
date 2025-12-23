import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Trophy,
  Swords,
  Clock,
  ListOrdered,
  Zap,
  ArrowLeft,
  Youtube,
  PlayCircle
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/tournaments";

// Helper function to extract and standardize the score data
const getMatchScores = (scoreData) => {
    if (!scoreData || !scoreData.sets || !Array.isArray(scoreData.sets)) {
        return null;
    }
    return scoreData.sets;
};

// Helper to get YouTube ID
const getYouTubeID = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function ScorecardPage() {
  const { eventId, matchId } = useParams();
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId || !matchId) {
      setError("Missing Event ID or Match ID in URL.");
      setLoading(false);
      return;
    }

    const fetchMatchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/${eventId}`);
        if (res.status === 404) throw new Error(`Tournament not found`);
        if (!res.ok) throw new Error("Server error");

        const data = await res.json();
        setTournament(data);

        let foundMatch = null;
        for (const event of data.events || []) {
          foundMatch = (event.fixtures || []).find((f) => f.id === matchId);
          if (foundMatch) {
            foundMatch.eventName = event.label;
            foundMatch.eventFormat = event.format;
            break;
          }
        }
        if (!foundMatch) throw new Error(`Match not found`);
        setMatch(foundMatch);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatchDetails();
  }, [eventId, matchId]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (error) return <div className="p-10 text-center text-red-600">{error}</div>;

  const teamA = match.teamA?.name || "Team A";
  const teamB = match.teamB?.name || "Team B";
  const matchSetScores = getMatchScores(match.score); 
  const [winnerName, winnerIcon] = determineWinner(match.score, teamA, teamB);
  
  // Video Logic
  const videoId = getYouTubeID(match.streamUrl || match.videoUrl);
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <Link to={`/user/${eventId}`} className="text-blue-600 flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to {tournament?.name || 'Event'}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Official Scorecard</h1>
      </div>

      {/* Match Info Card */}
      <div className="bg-white shadow-xl rounded-lg p-6 mb-8 border-t-4 border-blue-600">
        <p className="text-sm text-gray-500 mb-1 flex items-center">
            <ListOrdered className="w-4 h-4 mr-1.5" />
            {match.eventName} ({match.eventFormat})
        </p>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 text-center">
          {teamA} <span className="text-red-500 mx-4 font-normal">VS</span> {teamB}
        </h2>
        <div className="flex justify-around text-gray-600 border-t pt-4">
            <p className="flex items-center text-lg"><Clock className="w-5 h-5 mr-2 text-blue-500" /> {match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString() : 'TBD'}</p>
            <p className="flex items-center text-lg font-semibold text-green-600"><Zap className="w-5 h-5 mr-2" /> {match.status}</p>
        </div>
      </div>
      
      {/* Score Breakdown Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        
        {/* 1. Winner at Top */}
        {winnerName && (
            <div className="mb-8 pt-4 pb-8 border-b border-dashed border-gray-300 text-center">
                <p className="text-xl font-semibold text-gray-700">Winner</p>
                <h4 className="text-4xl font-extrabold text-green-700 mt-2 flex justify-center items-center">
                    <Trophy className="w-10 h-10 mr-3 fill-yellow-400 text-yellow-500" />
                    {winnerName}
                </h4>
                <p className="text-sm text-gray-500 mt-1">Final: {winnerIcon}</p>
            </div>
        )}

        {/* 2. Score Table in Middle */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Swords className="w-6 h-6 mr-3 text-red-600" />
          Set Breakdown
        </h3>
        {match.status === 'Completed' && matchSetScores ? (
            <ScoreTable matchSetScores={matchSetScores} teamA={teamA} teamB={teamB} />
        ) : (
             <p className="text-gray-500 italic">Score details will appear here after completion.</p>
        )}
      </div>

      {/* 3. YouTube Video Replay at Bottom (LiveMatchPage style) */}
      {/* Video Replay Section */}
<div className="mt-8">
  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
    <Youtube className="w-6 h-6 mr-2 text-red-600" />
    Match Replay
  </h3>

  {videoId ? (
    /* Show actual thumbnail if URL exists */
    <a 
      href={match.streamUrl || match.videoUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block group relative aspect-video rounded-xl overflow-hidden shadow-2xl border-4 border-white"
    >
      <img 
        src={thumbnailUrl} 
        alt="Match Thumbnail" 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <PlayCircle className="w-20 h-20 text-white opacity-90" />
      </div>
    </a>
  ) : (
    /* Show this placeholder box if no URL is entered */
    <div className="aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
      <Youtube className="w-12 h-12 mb-2 opacity-20" />
      <p className="italic font-medium">Video link not provided for this match</p>
    </div>
  )}
</div>
    </div>
  );
}

const ScoreTable = ({ matchSetScores, teamA, teamB }) => {
    return (
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600 text-white">
                    <tr>
                        <th className="py-3 px-4 text-left text-sm font-semibold">Team/Player</th>
                        {matchSetScores.map((_, index) => (
                            <th key={index} className="py-3 px-4 text-center text-sm font-semibold">Set {index + 1}</th>
                        ))}
                        {/* Corrected: This is the total sets won */}
                        <th className="py-3 px-4 text-center text-sm font-semibold">Sets Won</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{teamA}</td>
                        {matchSetScores.map((set, index) => (
                            <td key={index} className={`py-3 px-4 text-center text-lg ${set.a > set.b ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{set.a}</td>
                        ))}
                        <td className="py-3 px-4 text-center font-extrabold text-lg text-blue-800">
                            {matchSetScores.filter(s => s.a > s.b).length}
                        </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{teamB}</td>
                        {matchSetScores.map((set, index) => (
                            <td key={index} className={`py-3 px-4 text-center text-lg ${set.b > set.a ? 'font-bold text-blue-600' : 'text-gray-700'}`}>{set.b}</td>
                        ))}
                        <td className="py-3 px-4 text-center font-extrabold text-lg text-blue-800">
                            {matchSetScores.filter(s => s.b > s.a).length}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

const determineWinner = (scoreObject, teamA, teamB) => {
    if (!scoreObject) return [null, null];
    let setsWonA = scoreObject.a || 0;
    let setsWonB = scoreObject.b || 0;
    const matchSetScores = getMatchScores(scoreObject);
    if (setsWonA === 0 && setsWonB === 0 && matchSetScores) {
        matchSetScores.forEach((set) => {
            if (set.a > set.b) setsWonA++;
            else if (set.b > set.a) setsWonB++;
        });
    }
    if (setsWonA > setsWonB) return [teamA, `${setsWonA} sets to ${setsWonB}`];
    if (setsWonB > setsWonA) return [teamB, `${setsWonB} sets to ${setsWonA}`];
    return [null, null];
};