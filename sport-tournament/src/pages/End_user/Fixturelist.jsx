// src/pages/End_user/fixtures/FixtureList.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

export default function FixtureList() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/tournaments/all");
      if (!Array.isArray(res.data) || res.data.length === 0) {
        setError("No tournaments found.");
        setLoading(false);
        return;
      }
      const sorted = res.data.sort((a, b) => b.id - a.id);
      setTournaments(sorted);
      const defaultT = sorted.find(t => t.name === "IPT") || sorted[0];
      setSelectedTournament(defaultT);
      fetchFixtures(defaultT);
    } catch (err) {
      setError("Failed to load tournaments.");
      setLoading(false);
    }
  };

  const fetchFixtures = async (tournament) => {
    if (!tournament?.id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`http://localhost:5000/api/tournaments/${tournament.id}`);
      const event = res.data.events?.[0];
      if (!event?.fixtures?.length) {
        setError("No fixtures available yet.");
        setFixtures([]);
        setLoading(false);
        return;
      }

      const formatted = event.fixtures.map(f => ({
        ...f,
        teamA: f.teamA?.name || "TBD",
        teamB: f.teamB?.name || "TBD",
        score: f.score ? `${f.score.a}-${f.score.b}` : "vs",
        winner: f.score && f.score.a > f.score.b ? f.teamA?.name :
                f.score && f.score.b > f.score.a ? f.teamB?.name : null,
        round: f.round || 1,
        court: f.court || "-"
      }));
      setFixtures(formatted);
    } catch (err) {
      setError("Failed to load fixtures.");
      setFixtures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentChange = (e) => {
    const t = tournaments.find(x => x.id === Number(e.target.value));
    setSelectedTournament(t);
    fetchFixtures(t);
  };

  const getRoundFixtures = (round) => fixtures.filter(f => f.round === round);

  const qf = getRoundFixtures(1);
  const sf = getRoundFixtures(2);
  const final = getRoundFixtures(3);

  const MatchCard = ({ match, isFinal = false }) => (
    <div className={`bg-white rounded-md shadow-sm p-2 border ${isFinal ? 'border-yellow-400' : 'border-gray-200'} w-48 text-center`}>
      <div className="space-y-1 text-xs">
        <div className="font-medium truncate">{match.teamA}</div>
        <div className="font-bold text-base">{match.score}</div>
        <div className="font-medium truncate">{match.teamB}</div>
        {match.winner && <div className="text-green-600 font-bold text-xs">Win: {match.winner}</div>}
        <div className="text-xs text-gray-500">Court {match.court}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 py-6 px-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-indigo-900 mb-6">
          Knockout Bracket
        </h1>

        <div className="flex justify-center mb-8">
          <select
            value={selectedTournament?.id || ""}
            onChange={handleTournamentChange}
            className="px-5 py-2 text-base border-2 border-indigo-600 rounded-lg bg-white shadow"
          >
            {tournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {loading && <p className="text-center text-lg">Loading...</p>}
        {error && <p className="text-center text-red-600">{error}</p>}

        {(qf.length || sf.length || final.length) > 0 && (
          <div className="flex justify-center items-center gap-6">
            {/* Quarter-Finals */}
            {qf.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-bold text-purple-700">Quarter-Finals</h2>
                <div className="flex flex-col gap-4">
                  {qf.map((m, i) => <MatchCard key={i} match={m} />)}
                </div>
              </div>
            )}

            {/* Short connector */}
            {qf.length > 0 && sf.length > 0 && (
              <div className="w-12 h-0.5 bg-indigo-500 self-center" />
            )}

            {/* Semi-Finals */}
            {sf.length > 0 && (
              <div className="flex flex-col items-center gap-6">
                <h2 className="text-xl font-bold text-purple-700">Semi-Finals</h2>
                <div className="flex flex-col gap-6">
                  {sf.map((m, i) => <MatchCard key={i} match={m} />)}
                </div>
              </div>
            )}

            {/* Short connector */}
            {sf.length > 0 && final.length > 0 && (
              <div className="w-12 h-0.5 bg-yellow-500 self-center" />
            )}

            {/* Final */}
            {final.length > 0 && (
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold text-yellow-600 mb-4">FINAL</h2>
                {final.map((m, i) => <MatchCard key={i} match={m} isFinal />)}
                {final[0]?.winner && (
                  <div className="mt-3 text-lg font-bold text-green-700">🏆 {final[0].winner} 🏆</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}