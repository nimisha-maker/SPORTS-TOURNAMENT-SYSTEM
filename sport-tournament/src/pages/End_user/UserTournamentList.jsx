import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function UserTournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/tournaments/all")
      .then((res) => setTournaments(res.data))
      .catch((err) => console.error(err));
  }, []);

  const openTournament = (tournament) => {
    setSelectedTournament(tournament);
    setActiveTab("overview");
  };

  const closeTournament = () => {
    setSelectedTournament(null);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {!selectedTournament && (
        <>
          <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
            Upcoming Tournaments
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              justifyContent: "flex-start",
            }}
          >
            {tournaments.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "300px",
                  minHeight: "500px",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                }}
                onClick={() => openTournament(t)}
              >
                <div
                  style={{
                    width: "100%",
                    height: "180px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#e0e0e0",
                  }}
                >
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <ArrowRight size={40} color="#555" />
                  )}
                </div>
                <div style={{ padding: "15px", flexGrow: 1 }}>
                  <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
                    {t.name}
                  </h2>
                  <div>Date: {t.date || "TBD"}</div>
                  <div>Venue: {t.venue || "TBD"}</div>
                  <div>Type: {t.type || "General"}</div>
                </div>
                <button
                  style={{
                    margin: "15px",
                    padding: "10px 15px",
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 500,
                  }}
                  onClick={() => openTournament(t)}
                >
                  View Tournament
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedTournament && (
        <div>
          {/* Tournament Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#5c3ce9",
              color: "#fff",
              padding: "15px",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
              onClick={closeTournament}
            >
              <ArrowLeft size={24} />
              <span style={{ marginLeft: "10px", fontSize: "24px" }}>
                {selectedTournament.name}
              </span>
            </div>
            <span style={{ fontSize: "16px" }}>
              {selectedTournament.type || "General"}
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
            {["overview", "participants", "schedule", "live", "standings"].map(
              (tab) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    borderBottom:
                      activeTab === tab ? "3px solid #5c3ce9" : "3px solid transparent",
                    fontWeight: activeTab === tab ? "600" : "400",
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </div>
              )
            )}
          </div>

          {/* Tab Content */}
          <div style={{ padding: "20px", minHeight: "300px" }}>
            {activeTab === "overview" && (
              <div>
                <h2>Overview</h2>
                <p>
                  Tournament Name: {selectedTournament.name} <br />
                  Type: {selectedTournament.type || "General"} <br />
                  Date: {selectedTournament.date || "TBD"} <br />
                  Venue: {selectedTournament.venue || "TBD"}
                </p>
              </div>
            )}

            {activeTab === "participants" && (
              <div>
                <h2>Participants</h2>
                <p>
                  {/* Replace with actual participants if available */}
                  Participant data coming soon...
                </p>
              </div>
            )}

            {activeTab === "schedule" && (
              <div>
                <h2>Schedule</h2>
                <p>Schedule details coming soon...</p>
              </div>
            )}

            {activeTab === "live" && (
              <div>
                <h2>Live</h2>
                <p>Live matches will be displayed here...</p>
              </div>
            )}

            {activeTab === "standings" && (
              <div>
                <h2>Standings</h2>
                <p>Standings details coming soon...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
