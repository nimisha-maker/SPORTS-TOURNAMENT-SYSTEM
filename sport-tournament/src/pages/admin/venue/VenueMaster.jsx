import { useState, useEffect } from "react";
import axios from "axios";
import AddVenueForm from "./AddVenueForm";
import { Pencil, Trash2 } from "lucide-react";

export default function VenueMaster() {
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editVenue, setEditVenue] = useState(null); // EDIT MODE

  // ---------------------------
  // LOAD VENUES
  // ---------------------------
  const loadVenues = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/venues/all");
      setVenues(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

  // ---------------------------
  // DELETE VENUE
  // ---------------------------
  const deleteVenue = async (id) => {
    if (!window.confirm("Are you sure you want to delete this venue?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/venues/delete/${id}`);
      loadVenues();
    } catch (err) {
      console.log(err);
      alert("Failed to delete venue");
    }
  };

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Venue Master</h2>

        <button
          className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold 
                     hover:bg-blue-800 transition"
          onClick={() => {
            setEditVenue(null);
            setShowForm(true);
          }}
        >
          + Add Venue
        </button>
      </div>

      {/* VENUE TABLE */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Venue Name</th>
              <th className="py-3">City</th>
              <th className="py-3">State</th>
              <th className="py-3">Country</th>
              <th className="py-3">Grounds</th>
              <th className="py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No venues added yet.
                </td>
              </tr>
            ) : (
              venues.map((v) => (
                <tr key={v.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3 font-medium">{v.venueName}</td>
                  <td>{v.city}</td>
                  <td>{v.state}</td>
                  <td>{v.country}</td>

                  <td>
                    {v.grounds?.map((g) => (
                      <span
                        key={g.groundName}
                        className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mr-1"
                      >
                        {g.groundName} ({g.courtCount})
                      </span>
                    ))}
                  </td>

                  {/* ACTION ICONS */}
                  <td className="text-center flex items-center justify-center gap-4 py-3">

                    {/* EDIT */}
                    <Pencil
                      size={20}
                      className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                      onClick={() => {
                        setEditVenue(v);
                        setShowForm(true);
                      }}
                    />

                    {/* DELETE */}
                    <Trash2
                      size={20}
                      className="text-red-600 cursor-pointer hover:text-red-700"
                      onClick={() => deleteVenue(v.id)}
                    />

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <AddVenueForm
          closeForm={() => setShowForm(false)}
          refreshData={loadVenues}
          editVenue={editVenue} // PASS EDIT VENUE
        />
      )}
    </div>
  );
}
