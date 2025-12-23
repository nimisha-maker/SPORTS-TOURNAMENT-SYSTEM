import { useEffect, useState } from "react";
import axios from "axios";
import AddEvent from "../Event/AddEvent";
import { Pencil, Trash2 } from "lucide-react";

export default function EventMaster() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  // FETCH ALL EVENTS
  const loadEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events/all");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // LOAD ON PAGE OPEN
  useEffect(() => {
    loadEvents();
  }, []);

  // DELETE EVENT
  const deleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/events/delete/${id}`);
      loadEvents();
    } catch (err) {
      console.log(err);
      alert("Failed to delete event.");
    }
  };

  return (
    <div className="p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">Event Master</h2>

        <button
          className="bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold 
                     hover:bg-blue-800 transition"
          onClick={() => {
            setEditEvent(null);
            setShowForm(true);
          }}
        >
          + Create Event
        </button>
      </div>

      {/* EVENT TABLE */}
      <div className="bg-white p-6 rounded-xl shadow-lg border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-3">Banner</th>
              <th className="py-3">Event Name</th>
              <th className="py-3">Venue</th>
              <th className="py-3">Start</th>
              <th className="py-3">End</th>
              <th className="py-3">Status</th>
              <th className="py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-gray-500">
                  No events created yet.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="border-b hover:bg-gray-50 transition">
                  <td className="py-3">
                    {e.banner ? (
                      <img
                        src={e.banner}
                        className="h-12 rounded shadow"
                      />
                    ) : (
                      <span className="text-gray-400">No Banner</span>
                    )}
                  </td>

                  <td className="font-medium">{e.eventName}</td>
                  <td>{e.venueName}</td>
                  <td>{e.startDate}</td>
                  <td>{e.endDate}</td>

                  <td>
                    <span
                      className={`px-3 py-1 text-xs rounded-full ${
                        e.status === "Published"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>

                  {/* ACTION ICONS */}
                  <td className="text-center flex items-center justify-center gap-4 py-3">
                    <Pencil
                      size={20}
                      className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                      onClick={() => {
                        setEditEvent(e);
                        setShowForm(true);
                      }}
                    />

                    <Trash2
                      size={20}
                      className="text-red-600 cursor-pointer hover:text-red-700"
                      onClick={() => deleteEvent(e.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT EVENT FORM */}
      {showForm && (
        <AddEvent
          closeForm={() => setShowForm(false)}
          refreshData={loadEvents}
          editEvent={editEvent}
        />
      )}
    </div>
  );
}
