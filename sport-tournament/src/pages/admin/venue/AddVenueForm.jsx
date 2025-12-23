import { useState, useEffect } from "react";
import axios from "axios";
import { Search, MapPin, Globe } from "lucide-react"; // Imported icons for better UI

export default function AddVenueForm({ closeForm, refreshData }) {
  const [form, setForm] = useState({
    venueName: "",
    address: "",
    city: "",
    state: "",
    country: "",
    latitude: "",
    longitude: "",
    grounds: [],
    notes: "",
    mapUrl: "", // 1. Added mapUrl to state for manual entry
  });

  const [searchResults, setSearchResults] = useState([]);

  // Check if location data has been verified by the search
  const isLocationVerified = !!form.latitude;
  // Check if user has typed a name but location is not verified (manual entry mode)
  const isManuallyEnteringLocation = form.venueName && !isLocationVerified;

  // -------------------------------
  // SEARCH PLACES (API)
  // -------------------------------
  const searchVenue = async (value) => {
    setForm({
      ...form,
      venueName: value,
      // Clear location data and map URL when actively searching/typing a new name
      address: "",
      city: "",
      state: "",
      country: "",
      latitude: "",
      longitude: "",
      grounds: [], // Clear grounds on new search
      mapUrl: "", // Clear map URL on new search
    });

    if (value.length < 3) return setSearchResults([]);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${encodeURIComponent(value)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Geocoding search failed:", error);
      setSearchResults([]);
    }
  };

  // -------------------------------
  // HOW MANY GROUNDS / COURTS TO SELECT
  // -------------------------------
  const detectGrounds = (venueName) => {
    const lower = venueName.toLowerCase();

    if (lower.includes("padel"))
      return [{ groundType: "Padel", courtCount: 4, groundName: "Padel Court" }];

    if (lower.includes("cricket") || lower.includes("stadium") || lower.includes("ground"))
      return [{ groundType: "Cricket", courtCount: 1, groundName: "Main Cricket Ground" }];

    if (lower.includes("football") || lower.includes("turf"))
      return [{ groundType: "Football", courtCount: 1, groundName: "Football Turf" }];

    if (lower.includes("tennis"))
      return [{ groundType: "Tennis", courtCount: 2, groundName: "Tennis Court" }];

    if (lower.includes("badminton"))
      return [{ groundType: "Badminton", courtCount: 6, groundName: "Badminton Court" }];

    return [{ groundType: "General", courtCount: 1, groundName: "Main Ground" }];
  };

  const selectVenue = (place) => {
    const detected = detectGrounds(place.display_name);

    setForm({
      ...form,
      venueName: place.display_name.split(",")[0],
      address: place.display_name,
      city: place.address?.city || place.address?.town || place.address?.village || "",
      state: place.address?.state || "",
      country: place.address?.country || "",
      latitude: place.lat,
      longitude: place.lon,
      grounds: detected,
      mapUrl: "", // Clear map URL when a venue is successfully selected from search
    });

    setSearchResults([]);
  };

  // New handler for clearing location data (if user wants to manually enter)
  const clearLocationData = () => {
    setForm({
      ...form,
      address: "",
      city: "",
      state: "",
      country: "",
      latitude: "",
      longitude: "",
      grounds: [],
      mapUrl: "", // Clear map URL as well
    });
    setSearchResults([]);
  };

  const updateGround = (i, key, value) => {
    const g = [...form.grounds];
    g[i][key] = key === "courtCount" ? (Number(value) || 0) : value;
    setForm({ ...form, grounds: g });
  };

  const saveVenue = async () => {
    if (!form.venueName) return alert("Venue Name is required.");
    
    // 3. Validation check: require either verified location or manual mapUrl
    if (!isLocationVerified && !form.mapUrl) {
      return alert("Location must be either selected from search or a map URL must be provided.");
    }
    
    const payload = {
        ...form,
        // Fallback to a default ground if none were detected or kept
        grounds: form.grounds.length > 0 ? form.grounds : [{ groundType: "General", courtCount: 1, groundName: form.venueName || "Main Ground" }],
        id: Date.now(), // Simple ID generation
        searchReults: undefined, // Don't save transient state
    }

    try {
        // NOTE: Uses a post to a mock or simple API endpoint
        await axios.post("http://localhost:5000/api/venues/add", payload);
        refreshData();
        closeForm();
    } catch (error) {
        alert("Failed to save venue. Check console for details.");
        console.error("Save Venue Error:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-4xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto border border-blue-100">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Add Venue</h2>
          <button
            onClick={closeForm}
            className="text-red-600 text-xl hover:text-red-800"
          >
            ✖
          </button>
        </div>

        {/* MAP URL FIELD (New requirement - appears at the top) */}
        {isManuallyEnteringLocation && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center mb-2">
                    <Globe size={18} className="text-yellow-700 mr-2" />
                    <label className="font-bold text-yellow-700">Manually Add Map Location URL</label>
                </div>
                <p className="text-sm text-yellow-800 mb-2">
                    Since a location was not selected from the search, please provide a direct link (e.g., Google Maps, OpenStreetMap) to the venue.
                </p>
                <input
                    className="w-full border border-yellow-400 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="Enter Google Maps or OpenStreetMap URL"
                    value={form.mapUrl}
                    onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                />
            </div>
        )}
        
        {/* FORM */}
        <div className="grid grid-cols-2 gap-6">

          {/* VENUE SEARCH */}
          <div className="relative col-span-2">
            <label className="font-semibold text-gray-700">Venue Name</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                <input
                  className="w-full border border-blue-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-blue-400 outline-none"
                  placeholder="Search venue..."
                  value={form.venueName}
                  onChange={(e) => searchVenue(e.target.value)}
                />
              </div>
              {/* Button to clear location data if search was used */}
              {isLocationVerified && (
                <button
                  onClick={clearLocationData}
                  className="p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm flex items-center"
                  title="Clear location data to manually enter map link"
                >
                    <MapPin size={18} className="mr-1"/>Clear Map
                </button>
              )}
            </div>

            {/* DROPDOWN */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 bg-white shadow-xl border border-gray-200 rounded-lg mt-1 max-h-52 overflow-y-auto z-50">
                {searchResults.map((place, i) => (
                  <div
                    key={i}
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm"
                    onClick={() => selectVenue(place)}
                  >
                    {place.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* READONLY/INPUT FIELDS */}
          {[
            ["Address", "address"],
            ["City", "city"],
            ["State", "state"],
            ["Country", "country"],
            ["Latitude", "latitude"],
            ["Longitude", "longitude"],
          ].map(([label, key]) => (
            <div key={key}>
              <label className="font-semibold text-gray-700">{label}</label>
              <input
                className={`w-full border border-blue-300 rounded-lg p-3 ${isLocationVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                readOnly={isLocationVerified} // Make readOnly if verified by search
                value={form[key]}
                // Allow manual entry if not verified
                onChange={!isLocationVerified ? (e) => setForm({ ...form, [key]: e.target.value }) : undefined}
              />
            </div>
          ))}
        </div>

        {/* GROUNDS SECTION */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Ground / Court Mapping
          </h3>

          {form.grounds.length === 0 && isLocationVerified && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                No default grounds detected. Please update the venue name or manually add grounds below.
            </div>
          )}

          {form.grounds.map((g, i) => (
            <div key={i} className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">

              <label className="text-sm font-semibold">Ground Name</label>
              <input
                className="w-full border border-blue-300 rounded-lg p-3 mb-3"
                value={g.groundName}
                onChange={(e) => updateGround(i, "groundName", e.target.value)}
              />

              <label className="text-sm font-semibold">Ground Type</label>
              <input
                className="w-full border border-blue-300 rounded-lg p-3 mb-3"
                value={g.groundType}
                onChange={(e) => updateGround(i, "groundType", e.target.value)}
              />

              <label className="text-sm font-semibold">Court Count</label>
              <input
                type="number" // Use type number for better input control
                className="w-full border border-blue-300 rounded-lg p-3"
                value={g.courtCount}
                onChange={(e) => updateGround(i, "courtCount", e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* SAVE BUTTON */}
        <button
          className="w-full bg-blue-700 text-white py-3 rounded-lg mt-6 text-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          onClick={saveVenue}
          disabled={!form.venueName || (!isLocationVerified && !form.mapUrl)}
        >
          Save Venue
        </button>
      </div>
    </div>
  );
}