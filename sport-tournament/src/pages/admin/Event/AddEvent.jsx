import { useEffect, useState } from "react";
import axios from "axios";
import AddVenueForm from "../venue/AddVenueForm";

export default function AddEvent({ closeForm, refreshData, editEvent }) {
  const [venues, setVenues] = useState([]);
  const [showVenueForm, setShowVenueForm] = useState(false);

  const [form, setForm] = useState({
    eventName: "",
    description: "",
    startDate: "",
    endDate: "",
    venueId: "",
    venueName: "",
    banner: "",
    domain: "",
    status: "Draft",
  });

  useEffect(() => {
    if (editEvent) setForm(editEvent);
  }, [editEvent]);

  // LOAD VENUES
  const fetchVenues = async () => {
    const res = await axios.get("http://localhost:5000/api/venues/all");
    setVenues(res.data);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  // SAVE EVENT
  const saveEvent = async () => {
    const url = editEvent
      ? `http://localhost:5000/api/events/update/${editEvent.id}`
      : "http://localhost:5000/api/events/add";

    await axios({
      method: editEvent ? "put" : "post",
      url,
      data: form,
    });

    refreshData();
    closeForm();
  };

  // BANNER UPLOAD
  const handleBanner = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, banner: reader.result });
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white w-[90%] max-w-5xl p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">
              {editEvent ? "Edit Event" : "Add Event"}
            </h2>
            <button onClick={closeForm}>❌</button>
          </div>

          {/* FORM START */}
          <div className="grid grid-cols-2 gap-6">

            {/* EVENT NAME */}
            <div className="col-span-2">
              <label className="font-semibold">Event Name</label>
              <input
                className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500"
                value={form.eventName}
                placeholder="Enter Event Name"
                onChange={(e) =>
                  setForm({ ...form, eventName: e.target.value })
                }
              />
            </div>

            {/* DESCRIPTION */}
            <div className="col-span-2">
              <label className="font-semibold">Description</label>
              <textarea
                className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1 h-24 focus:ring-2 focus:ring-blue-500"
                placeholder="Write short description..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>

            {/* DATES */}
            <div>
              <label className="font-semibold">Start Date</label>
              <input
                type="date"
                className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold">End Date</label>
              <input
                type="date"
                className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
              />
            </div>

            {/* DOMAIN */}
            <div className="col-span-2">
              <label className="font-semibold">Custom Domain (Optional)</label>
              <input
                className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1"
                placeholder="example.sportsmaster.in"
                value={form.domain}
                onChange={(e) =>
                  setForm({ ...form, domain: e.target.value })
                }
              />
            </div>

            {/* VENUE DROPDOWN */}
            <div className="col-span-2">
              <label className="font-semibold">Select Venue</label>

              {venues.length === 0 ? (
                <div className="p-4 border border-yellow-400 bg-yellow-50 rounded-lg mt-2">
                  <p className="text-yellow-700">
                    No venues available. Please create a venue first.
                  </p>
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
                    onClick={() => setShowVenueForm(true)}
                  >
                    + Create Venue
                  </button>
                </div>
              ) : (
                <select
                  className="w-full border border-blue-300 px-3 py-2 rounded-lg mt-1"
                  value={form.venueId}
                  onChange={(e) => {
                    const v = venues.find((x) => x.id == e.target.value);
                    setForm({
                      ...form,
                      venueId: v.id,
                      venueName: v.venueName,
                    });
                  }}
                >
                  <option value="">Select Venue</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.venueName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* BANNER UPLOAD (MODERN UI) */}
            <div className="col-span-2">
              <label className="font-semibold">Event Banner</label>

              <div
                className="border border-blue-300 rounded-lg p-4 mt-1 bg-gray-50 cursor-pointer text-center hover:bg-blue-50 transition"
                onClick={() => document.getElementById("bannerInput").click()}
              >
                <input
                  id="bannerInput"
                  type="file"
                  className="hidden"
                  onChange={(e) => handleBanner(e.target.files[0])}
                />

                {!form.banner ? (
                  <p className="text-gray-500">Click to upload banner (PNG/JPG)</p>
                ) : (
                  <img
                    src={form.banner}
                    className="h-32 mx-auto rounded shadow"
                  />
                )}
              </div>
            </div>

            {/* STATUS */}
            <div className="col-span-2 mt-4 flex gap-4">
              <button
                className={`px-5 py-2 rounded-lg border ${
                  form.status === "Draft"
                    ? "bg-gray-300 text-gray-900"
                    : "bg-white"
                }`}
                onClick={() => setForm({ ...form, status: "Draft" })}
              >
                Draft
              </button>

              <button
                className={`px-5 py-2 rounded-lg border ${
                  form.status === "Published"
                    ? "bg-green-300 text-green-900"
                    : "bg-white"
                }`}
                onClick={() => setForm({ ...form, status: "Published" })}
              >
                Published
              </button>
            </div>
          </div>

          {/* SAVE BUTTON */}
          <button
            className="bg-blue-700 text-white px-6 py-3 rounded-lg w-full mt-6 font-semibold"
            onClick={saveEvent}
          >
            Save Event
          </button>
        </div>
      </div>

      {/* NESTED VENUE CREATION */}
      {showVenueForm && (
        <AddVenueForm
          closeForm={() => {
            setShowVenueForm(false);
            fetchVenues();
          }}
          refreshData={fetchVenues}
        />
      )}
    </>
  );
}
