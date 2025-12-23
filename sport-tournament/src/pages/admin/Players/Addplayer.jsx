import { useState, useEffect } from "react";
import axios from "axios";
import { Upload, Download, User, Users } from "lucide-react";

export default function AddPlayer({ closeForm, refreshData, editPlayer }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    dob: "",
    email: "",
    mobile: "",
    status: "Active",
    photo: "", // This holds the Base64/URL for the photo
  });

  const [photoPreview, setPhotoPreview] = useState("");
  const [csvUploadError, setCsvUploadError] = useState("");

  // ======================================================
  // EDIT MODE
  // ======================================================
  useEffect(() => {
    if (editPlayer) {
      setForm(editPlayer);
      setPhotoPreview(editPlayer.photo);
    }
  }, [editPlayer]);


  // ======================================================
  // PHOTO UPLOAD (PNG/JPG ONLY)
  // ======================================================
  const handleImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg"];
    if (!allowed.includes(file.type)) {
      alert("Only PNG or JPEG images are allowed!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, photo: reader.result });
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };


  // ======================================================
  // DOWNLOAD CSV TEMPLATE (UPDATED for photoUrl)
  // ======================================================
  const downloadCSV = () => {
    // Added 'photoUrl' column to the header for bulk photo setting
    const headers = [
      "photoUrl (Optional: Direct Image URL or Base64 String),firstName,lastName,gender,dob,email,mobile,status"
    ];

    const blob = new Blob([headers.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "player_template.csv";
    a.click();
  };


  // ======================================================
  // BULK CSV UPLOAD (UPDATED to parse photoUrl)
  // ======================================================
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setCsvUploadError("Please upload a valid CSV file!");
      return;
    }

    const text = await file.text();
    const rows = text.split("\n").slice(1); // skip header

    const parsedPlayers = rows
      .map((row) => row.split(","))
      .filter((cols) => cols.length >= 6) // Minimum columns for basic data
      .map((cols) => ({
        id: Date.now() + Math.random(),
        // Note: CSV parsing is based on column order
        photo: cols[0]?.trim() || "", // Photo URL is now the first column
        firstName: cols[1]?.trim() || "",
        lastName: cols[2]?.trim() || "",
        gender: cols[3]?.trim() || "",
        dob: cols[4]?.trim() || "",
        email: cols[5]?.trim() || "",
        mobile: cols[6]?.trim() || "",
        status: cols[7]?.trim() || "Active",
      }));

    try {
      await axios.post("http://localhost:5000/api/players/bulk-upload", parsedPlayers);
      refreshData();
      closeForm();
    } catch (err) {
      setCsvUploadError("Bulk upload failed. Check CSV format and API endpoint.");
    }
  };


  // ======================================================
  // SAVE PLAYER (ADD OR EDIT)
  // ======================================================
  const savePlayer = async () => {
    if (!form.firstName || !form.lastName) {
        return alert("First Name and Last Name are required.");
    }
    
    try {
      const url = editPlayer
        ? `http://localhost:5000/api/players/edit/${editPlayer.id}`
        : "http://localhost:5000/api/players/add";

      await axios.post(url, form);

      refreshData();
      closeForm();
    } catch (err) {
      alert("Failed to save player");
    }
  };


  // ======================================================
  // Form UI (Updated structure with smaller boxes)
  // ======================================================
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-4xl p-6 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h2 className="text-2xl font-bold text-blue-700">
            {editPlayer ? "Edit Player" : "Add Player"}
          </h2>
          <button onClick={closeForm} className="text-red-600 hover:text-red-800 transition">❌</button>
        </div>


        {/* TOP SECTION: Photo + Bulk Upload (SIDE-BY-SIDE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
          {/* PLAYER PHOTO SECTION */}
          {/* Reduced outer padding to p-3 */}
          <div className="p-3 border rounded-xl bg-blue-50/70 flex flex-col items-center justify-center">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><User size={20} className="mr-2"/>Player Profile Photo</h3>
            
            {/* Reduced inner padding to p-4 */}
            <div
                className="border-2 border-dashed border-blue-400 bg-white rounded-xl
                    p-4 flex flex-col items-center justify-center cursor-pointer
                    hover:bg-blue-100 transition w-full max-w-xs"
            >
                {/* Hidden Input */}
                <input
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    id="playerPhoto"
                    onChange={handleImage}
                />

                {/* Upload Button */}
                <label htmlFor="playerPhoto" className="cursor-pointer flex flex-col items-center">
                    {photoPreview ? (
                        <img
                            src={photoPreview}
                            // Reduced size to w-20 h-20
                            className="w-20 h-20 rounded-full border-4 border-blue-300 object-cover shadow-lg"
                            alt="Preview"
                        />
                    ) : (
                        // Reduced size to w-20 h-20 and font size to text-2xl
                        <div className="w-20 h-20 flex items-center justify-center bg-blue-200 text-blue-700 rounded-full text-2xl font-bold">
                            +
                        </div>
                    )}
                    <p className="mt-2 font-medium text-blue-700 text-sm">
                        {photoPreview ? "Change Photo" : "Upload Photo"}
                    </p>
                    <p className="text-xs text-gray-500">PNG or JPG only</p>
                </label>
            </div>
          </div>
          
          {/* BULK UPLOAD SECTION */}
          {/* Reduced outer padding to p-3 */}
          <div className="p-3 border rounded-xl bg-green-50/70 flex flex-col justify-center">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center"><Users size={20} className="mr-2"/>Bulk Upload Players</h3>
            <p className="text-sm text-gray-600 mb-4">
                Use a CSV file to add multiple players at once. The template now includes an optional column for the profile photo URL.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={downloadCSV}
                // Reduced vertical padding to py-2
                className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition shadow text-sm"
              >
                <Download size={18} className="mr-2"/> Download CSV Template
              </button>

              <label 
                // Reduced vertical padding to py-2
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition shadow text-sm"
              >
                <Upload size={18} className="mr-2"/> Upload CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              </label>
            </div>

            {csvUploadError && (
              <p className="text-red-600 text-sm mt-3 font-medium">{csvUploadError}</p>
            )}
          </div>
        </div>


        {/* MAIN FORM FIELDS (2 columns) */}
        <div className="grid grid-cols-2 gap-6">

          <input
            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />

          <input
            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />

          <select
            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <div>
            <label className="font-semibold text-gray-700 block mb-1">Date of Birth</label>
            <input
              type="date"
              className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
            />
          </div>


          <input
            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />

          <select
            className="col-span-2 w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>


        {/* SAVE BUTTON */}
        <button
          className="bg-blue-700 text-white px-6 py-3 w-full rounded-lg mt-8 text-lg font-semibold hover:bg-blue-800 transition"
          onClick={savePlayer}
        >
          {editPlayer ? "Update Player" : "Save Player"}
        </button>

      </div>
    </div>
  );
}