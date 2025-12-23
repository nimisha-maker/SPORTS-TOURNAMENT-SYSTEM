import { useLocation } from "react-router-dom";

export default function PlayerList() {
  const location = useLocation();

  const players = location.state?.players || [];
  const teamName = location.state?.teamName || "Players";

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-white p-6 rounded-2xl shadow border">
        <h2 className="text-3xl font-bold text-blue-900">
          {teamName}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Team Players List
        </p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow border overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-100">
            <tr className="text-gray-600 text-left text-sm">
              <th className="p-4">Player</th>
              <th>Name</th>
              <th>Gender</th>
            </tr>
          </thead>

          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center py-10 text-gray-500">
                  No players found for this team
                </td>
              </tr>
            ) : (
              players.map((p) => (
                <tr
                  key={p.id}
                  className="border-t hover:bg-gray-50 transition"
                >
                  {/* Player Photo */}
                  <td className="p-4">
                    {p.photo ? (
                      <img
                        src={p.photo}
                        alt={p.firstName}
                        className="w-11 h-11 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-lg">
                        {p.firstName?.charAt(0)}
                      </div>
                    )}
                  </td>

                  {/* Name */}
                  <td className="font-semibold text-blue-900">
                    {p.firstName} {p.lastName}
                  </td>

                  {/* Gender */}
                  <td className="text-gray-700">
                    {p.gender || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
