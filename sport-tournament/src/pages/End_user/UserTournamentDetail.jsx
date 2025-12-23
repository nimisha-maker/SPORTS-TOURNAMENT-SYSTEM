// src/pages/End_user/UserTournamentDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Clock } from "lucide-react";

export default function UserTournamentDetail() {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/tournaments/${id}`)
      .then(res => setTournament(res.data))
      .catch(err => {
        console.error(err);
        setTournament(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-40 text-3xl font-bold">Loading...</div>;
  if (!tournament) return <div className="text-center py-40 text-red-600 text-2xl">Tournament not found</div>;

  const event = tournament.events?.[0] || {};
  const fixtures = event.fixtures || [];

  // Helper to get team name safely
  const getTeamName = (team) => {
    if (!team) return "TBD";
    if (team.players && team.players.length >= 2) {
      const p1 = team.players[0]?.firstName || team.players[0]?.name || "Player 1";
      const p2 = team.players[1]?.firstName || team.players[1]?.name || "Player 2";
      return `${p1} / ${p2}`;
    }
    return team.teamName || team.name || "TBD";
  };

  // Find live match
  const liveMatch = fixtures.find(f => f.status === "Live" || f.status === "live");

  // Calculate simple set wins for display (a vs b)
  const getSetScore = (fixture) => {
    if (!fixture.score?.sets) return { a: 0, b: 0 };
    let a = 0, b = 0;
    fixture.score.sets.forEach(set => {
      if (set.a > set.b) a++;
      else if (set.b > set.a) b++;
    });
    return { a, b };
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div
        className="relative text-white"
        style={{
          backgroundImage: `url("https://static.vecteezy.com/system/resources/thumbnails/000/701/690/small/abstract-polygonal-banner-background.jpg")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative max-w-7xl mx-auto px-6 py-12 flex justify-between items-start">
          <div className="flex items-center gap-6">
            <Link to="/user/dashboard" className="text-white hover:text-gray-300">
              <ArrowLeft size={32} />
            </Link>

            <div>
              <h1 className="text-5xl font-extrabold">{tournament.name}</h1>
              <p className="text-2xl mt-2">
                Padel | {event.label || event.category || "WOMEN'S"}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-blue-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-10">
            {["OVERVIEW", "PARTICIPANTS", "SCHEDULE", "LIVE", "STANDINGS"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-6 px-6 font-medium text-lg border-b-4 transition-all ${
                  activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Information</h2>
              <hr className="mb-6 border-gray-300" />
              <p className="text-gray-600 mb-8 text-lg">{tournament.description || "No description provided."}</p>
              <div className="grid grid-cols-2 gap-6 text-lg">
                <div>Start: {new Date(tournament.startDate).toLocaleDateString()}</div>
                <div>End: {new Date(tournament.endDate).toLocaleDateString()}</div>
                <div>Venue: {tournament.venue || "TBD"}</div>
                <div>Total participants: {event.participants?.length || 0}</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-3xl p-10">
              <h3 className="text-2xl font-bold text-blue-700 mb-4">Live Alert</h3>
              {liveMatch ? (
                <div className="text-center">
                  <p className="text-red-600 font-bold text-xl flex items-center justify-center gap-2">
                    <Clock className="animate-pulse" /> LIVE NOW
                  </p>
                  <p className="mt-4 text-xl font-bold">
                    {getTeamName(liveMatch.teamA)} vs {getTeamName(liveMatch.teamB)}
                  </p>
                  <button
                    onClick={() => setActiveTab("LIVE")}
                    className="mt-4 px-6 py-3 bg-red-600 text-white rounded-full font-bold"
                  >
                    Watch Live
                  </button>
                </div>
              ) : (
                <p className="text-gray-700 text-lg">No match currently live.</p>
              )}
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {activeTab === "PARTICIPANTS" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">{event.label || "WOMEN'S"} Participants</h2>
            <div className="bg-white rounded-3xl shadow-lg p-10 border">
              <div className="grid md:grid-cols-3 gap-10">
                {(event.participants || []).map((team, i) => (
                  <div key={team.id || i} className="bg-gray-50 p-8 rounded-2xl border text-center">
                    <p className="font-bold text-blue-600 text-lg">
                      {team.teamName || `Double Team ${i + 1}`}
                    </p>
                    <p className="mt-4 text-xl font-semibold">
                      {getTeamName(team)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE – Now correctly fetches real fixtures */}
        {activeTab === "SCHEDULE" && (
          <div className="space-y-12">
            <h2 className="text-3xl font-bold mb-8">Schedule</h2>

            {fixtures.length === 0 ? (
              <p className="text-center text-gray-500 text-xl">No matches scheduled yet.</p>
            ) : (
              [...new Set(fixtures.map(f => f.round))]
                .sort((a, b) => a - b)
                .map(roundNum => (
                  <div key={roundNum}>
                    <h3 className="text-2xl font-bold text-blue-700 mb-6">
                      Round {roundNum}
                    </h3>
                    <div className="space-y-6">
                      {fixtures
                        .filter(f => Number(f.round) === roundNum)
                        .map((match, i) => {
                          const setScore = getSetScore(match);
                          return (
                            <div
                              key={match.id}
                              className="bg-white rounded-2xl shadow-md border p-8 flex justify-between items-center"
                            >
                              <div className="space-y-4">
                                <p className="text-xl font-bold text-blue-600">
                                  {getTeamName(match.teamA)}
                                </p>
                                <p className="text-xl font-bold text-red-600">
                                  {getTeamName(match.teamB)}
                                </p>
                              </div>

                              <div className="text-center">
                                <div className="text-5xl font-black">
                                  <span className="text-blue-700">{setScore.a}</span>
                                  <span className="mx-4 text-gray-400">-</span>
                                  <span className="text-red-700">{setScore.b}</span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                  {match.status} {match.court ? `• Court ${match.court}` : ""}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* LIVE – Now shows real live match with correct names & score */}
        {activeTab === "LIVE" && (
          <div className="space-y-10">
            <h2 className="text-3xl font-bold mb-8">Live Match</h2>

            {!liveMatch ? (
              <div className="bg-blue-50 rounded-3xl p-16 text-center">
                <h3 className="text-3xl font-bold text-blue-700 mb-4">
                  No Live Match
                </h3>
                <p className="text-xl text-gray-600">
                  Currently no match is being played live.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border shadow-2xl p-12">
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-8 mb-8">
                  <h2 className="text-4xl font-extrabold text-blue-800">
                    LIVE MATCH
                  </h2>
                  <span className="bg-red-600 text-white px-8 py-3 rounded-full font-bold text-2xl flex items-center gap-3">
                    <span className="h-3 w-3 bg-white rounded-full animate-ping"></span>
                    LIVE
                  </span>
                </div>

                {/* Teams & Big Score */}
                <div className="grid md:grid-cols-3 items-center text-center gap-12">
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {getTeamName(liveMatch.teamA)}
                    </p>
                  </div>

                  <div className="text-7xl font-black">
                    <span className="text-blue-700">{getSetScore(liveMatch).a}</span>
                    <span className="mx-6 text-gray-400">-</span>
                    <span className="text-red-700">{getSetScore(liveMatch).b}</span>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-red-700">
                      {getTeamName(liveMatch.teamB)}
                    </p>
                  </div>
                </div>

                {/* Detailed sets if available */}
                {liveMatch.score?.sets && liveMatch.score.sets.length > 0 && (
                  <div className="mt-12 text-center">
                    <p className="text-lg font-semibold text-gray-600 mb-4">Set Details</p>
                    <div className="inline-grid grid-cols-3 gap-8 text-xl">
                      <span className="font-bold text-blue-600">{getTeamName(liveMatch.teamA)}</span>
                      <span className="font-bold text-gray-500">Set</span>
                      <span className="font-bold text-red-600">{getTeamName(liveMatch.teamB)}</span>
                      {liveMatch.score.sets.map((set, i) => (
                        <>
                          <span key={`a${i}`}>{set.a}</span>
                          <span key={`set${i}`} className="text-gray-600">Set {i + 1}</span>
                          <span key={`b${i}`}>{set.b}</span>
                        </>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STANDINGS – NOW USING EXACT LOGIC FROM YOUR SHARED FILE */}
        {activeTab === "STANDINGS" && (
          <div>
            <h2 className="text-3xl font-bold mb-8">Standings: {event.label || "WOMEN'S"}</h2>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-900 text-white text-lg">
                  <tr>
                    <th className="p-6">RANK</th>
                    <th className="p-6 text-left">PARTICIPANT</th>
                    <th className="p-6">PL</th>
                    <th className="p-6">W</th>
                    <th className="p-6">L</th>
                    <th className="p-6">PD</th>
                    <th className="p-6">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Exact standings calculation from your shared admin file
                    const stats = {};
                    (event.participants || []).forEach(p => {
                      stats[p.id] = {
                        id: p.id,
                        name: getTeamName(p),
                        played: 0,
                        w: 0,
                        l: 0,
                        pts: 0,
                        pd: 0
                      };
                    });

                    fixtures
                      .filter(f => f.status === "Completed" && f.teamA && f.teamB && f.score)
                      .forEach(f => {
                        const aId = f.teamA.id;
                        const bId = f.teamB.id;

                        if (!stats[aId] || !stats[bId]) return;

                        let scoreA = 0;
                        let scoreB = 0;

                        if (f.score.sets && Array.isArray(f.score.sets)) {
                          f.score.sets.forEach(set => {
                            if (set.a > set.b) scoreA++;
                            else if (set.b > set.a) scoreB++;
                          });
                        } else {
                          scoreA = Number(f.score.a || 0);
                          scoreB = Number(f.score.b || 0);
                        }

                        stats[aId].played += 1;
                        stats[bId].played += 1;

                        stats[aId].pd += (scoreA - scoreB);
                        stats[bId].pd += (scoreB - scoreA);

                        if (scoreA > scoreB) {
                          stats[aId].w += 1;
                          stats[aId].pts += 2;  // or 3 if you prefer 3 points per win
                          stats[bId].l += 1;
                        } else if (scoreB > scoreA) {
                          stats[bId].w += 1;
                          stats[bId].pts += 2;
                          stats[aId].l += 1;
                        }
                      });

                    const standingsList = Object.values(stats)
                      .sort((a, b) => b.pts - a.pts || b.pd - a.pd || b.w - a.w);

                    return standingsList.length > 0 ? (
                      standingsList.map((team, i) => (
                        <tr key={team.id} className="border-t hover:bg-gray-50">
                          <td className="p-6 text-center font-bold text-blue-600 text-2xl">{i + 1}</td>
                          <td className="p-6 font-semibold">{team.name}</td>
                          <td className="p-6 text-center">{team.played}</td>
                          <td className="p-6 text-center text-green-600 font-bold">{team.w}</td>
                          <td className="p-6 text-center text-red-600 font-bold">{team.l}</td>
                          <td className="p-6 text-center">{team.pd > 0 ? `+${team.pd}` : team.pd}</td>
                          <td className="p-6 text-center font-bold text-purple-600 text-2xl">{team.pts}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-10 text-center text-gray-500">
                          Standings will appear after matches are completed.
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}