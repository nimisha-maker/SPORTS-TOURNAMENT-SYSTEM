import { useEffect, useState } from "react";
import axios from "axios";

const TEMPLATES = {
  Cricket: {
    scoringType: "Ball-by-ball",
    overs: 20,
    sets: null,
    tieBreak: ["Super Over"],
    notes: "Standard cricket rules – ball-by-ball scoring."
  },
  Padel: {
    scoringType: "Set-wise",
    sets: 3,
    overs: null,
    tieBreak: ["Golden Point"],
    notes: "Padel uses set logic; typical 3-set match with golden point tie-break."
  },
  Badminton: {
    scoringType: "Set-wise",
    sets: 3,
    overs: null,
    tieBreak: ["Golden Point"],
    notes: "Best of 3 sets, 21 points per set."
  },
  Tennis: {
    scoringType: "Set-wise",
    sets: 3,
    overs: null,
    tieBreak: ["Set tiebreak (7)"],
    notes: "Tennis scoring template; choose 3 or 5 sets."
  },
  Football: {
    scoringType: "Points-based",
    sets: null,
    overs: null,
    tieBreak: ["Penalty Shootout"],
    notes: "Football logic with goal scoring and penalty shootout tie-break."
  }
};

export default function AddSport({ closeForm, refreshData, editSport }) {
  const [form, setForm] = useState({
    name: "",
    icon: "",
    scoringType: "Set-wise",
    sets: 3,
    overs: null,
    tieBreak: [],
    notes: ""
  });

  useEffect(() => {
    if (editSport) {
      setForm(editSport);
    }
  }, [editSport]);

  // when user selects a known sport name, auto-fill template
  useEffect(() => {
    const key = form.name?.trim();
    if (!key) return;
    const template = Object.keys(TEMPLATES).find(k => k.toLowerCase() === key.toLowerCase());
    if (template) {
      const tpl = TEMPLATES[template];
      setForm(prev => ({ ...prev, ...tpl, name: template }));
    }
  }, [form.name]);

  const handleIcon = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => setForm(prev => ({ ...prev, icon: reader.result }));
    reader.readAsDataURL(file);
  };

  const toggleTieBreak = (option) => {
    setForm(prev => {
      const set = new Set(prev.tieBreak || []);
      if (set.has(option)) set.delete(option); else set.add(option);
      return { ...prev, tieBreak: Array.from(set) };
    });
  };

  const saveSport = async () => {
    try {
      if (editSport) {
        await axios.put(`http://localhost:5000/api/sports/update/${editSport.id}`, form);
      } else {
        await axios.post("http://localhost:5000/api/sports/add", form);
      }
      refreshData();
      closeForm();
    } catch (err) {
      console.error("Save sport error:", err);
      alert("Failed to save sport.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-3xl p-6 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto border border-blue-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{editSport ? "Edit Sport" : "Add Sport"}</h3>
          <button onClick={closeForm} className="text-gray-600">✖</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="font-semibold">Sport Name (type or pick)</label>
            <input
              className="w-full border border-blue-300 rounded-lg p-3 mt-1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cricket, Padel, Badminton"
            />
          </div>

          <div>
            <label className="font-semibold">Scoring Type</label>
            <select
              className="w-full border border-blue-300 rounded-lg p-3 mt-1"
              value={form.scoringType}
              onChange={(e) => setForm({ ...form, scoringType: e.target.value })}
            >
              <option>Set-wise</option>
              <option>Ball-by-ball</option>
              <option>Points-based</option>
            </select>
          </div>

          <div>
            <label className="font-semibold">Icon Upload</label>
            <div
              className="border border-blue-300 p-3 rounded-lg mt-1 text-center cursor-pointer bg-gray-50"
              onClick={() => document.getElementById("sportIcon")?.click()}
            >
              <input id="sportIcon" type="file" accept="image/*" className="hidden" onChange={(e)=>handleIcon(e.target.files[0])} />
              {!form.icon ? <span className="text-gray-500">Click to upload icon</span> :
                <img src={form.icon} className="w-16 h-16 mx-auto rounded" alt="icon"/>}
            </div>
          </div>

          <div>
            <label className="font-semibold">Number of Sets</label>
            <input
              type="number"
              className="w-full border border-blue-300 rounded-lg p-3 mt-1"
              value={form.sets || ""}
              onChange={(e) => setForm({ ...form, sets: Number(e.target.value || 0) || null })}
            />
          </div>

          <div>
            <label className="font-semibold">Overs (for cricket)</label>
            <input
              type="number"
              className="w-full border border-blue-300 rounded-lg p-3 mt-1"
              value={form.overs || ""}
              onChange={(e) => setForm({ ...form, overs: Number(e.target.value || 0) || null })}
            />
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Tie Break Options</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["Super Over", "Penalty Shootout", "Golden Point", "Set tiebreak (7)"].map(opt => (
                <button
                  key={opt}
                  onClick={() => toggleTieBreak(opt)}
                  className={`px-3 py-1 rounded-full border ${form.tieBreak?.includes(opt) ? "bg-blue-100 border-blue-300" : "bg-white"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-2">
            <label className="font-semibold">Custom Rules / Notes</label>
            <textarea
              className="w-full border border-blue-300 rounded-lg p-3 mt-1 h-28"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 rounded border" onClick={closeForm}>Cancel</button>
          <button className="px-6 py-2 rounded bg-blue-700 text-white" onClick={saveSport}>
            {editSport ? "Update Sport" : "Create Sport"}
          </button>
        </div>
      </div>
    </div>
  );
}
