import { useEffect, useState } from "react";
import axios from "axios";
import { roleDefaults } from "../../../helpers/roleDefaults"; // optional shared frontend defaults

const MODULES = ["Events","Venues","Sports","Players","Teams",,"Scoring Panel","Commentary Panel"];
const ROLES = ["Super Admin","Admin","Scorer","Commentator","Team Manager","Read-Only"];

export default function AddUser({ close, editUser }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", mobile: "", password: "", confirmPassword: "", status: "Active",
    role: "Read-Only", permissions: {}
  });

  // load role defaults locally (frontend helpers) — if not available, you can call an API
  useEffect(() => {
    // default permissions: read-only
    const perm = {};
    MODULES.forEach(m => perm[m] = {view:true,create:false,edit:false,delete:false});
    setForm(f => ({...f, permissions: perm}));
  }, []);

  useEffect(() => {
    if (editUser) {
      setForm({
        fullName: editUser.fullName,
        email: editUser.email,
        mobile: editUser.mobile,
        password: "",
        confirmPassword: "",
        status: editUser.status || "Active",
        role: editUser.role,
        permissions: editUser.permissions || {}
      });
    }
  }, [editUser]);

  // On role change autofill default permissions (frontend)
  const applyRoleDefaults = (role) => {
    // try to use roleDefaults if provided (imported) else request backend later
    let defaults;
    try {
      defaults = roleDefaults[role]; // if you add helper export roleDefaults (see backend for same object)
    } catch (e) { defaults = null; }
    if (!defaults) {
      // basic defaults fallback
      defaults = MODULES.reduce((acc,m)=>{ acc[m] = {view:true,create:false,edit:false,delete:false}; return acc; }, {});
      if (role === "Super Admin" || role === "Admin") {
        MODULES.forEach(m => defaults[m] = {view:true,create:true,edit:true,delete:true});
      }
      if (role === "Scorer") { defaults["Scoring Panel"] = {view:true,create:false,edit:true,delete:false}; }
      if (role === "Commentator") { defaults["Commentary Panel"] = {view:true,create:true,edit:true,delete:false}; }
      if (role === "Team Manager") { defaults["Teams"] = {view:true,create:true,edit:true,delete:false}; defaults["Players"] = {view:true,create:true,edit:true,delete:false}; }
      if (role === "Read-Only") { /* already view-only */ }
    }
    setForm(prev => ({...prev, role, permissions: defaults}));
  };

  const toggle = (module, key) => {
    setForm(prev => {
      const p = {...prev.permissions};
      p[module] = {...p[module], [key]: !p[module]?.[key]};
      return {...prev, permissions: p};
    });
  };

  const save = async () => {
    if (!form.fullName || !form.email) return alert("Name & email required");
    if (!editUser && (!form.password || form.password !== form.confirmPassword)) return alert("Password mismatch or empty");
    setLoading(true);
    try {
      if (editUser) {
        await axios.post(`http://localhost:5000/api/users/edit/${editUser.id}`, {
          fullName: form.fullName,
          mobile: form.mobile,
          status: form.status,
          role: form.role,
          permissions: form.permissions,
          password: form.password || undefined,
          updatedBy: "SUPER_ADMIN_UI"
        });
      } else {
        await axios.post("http://localhost:5000/api/users/add", {
          fullName: form.fullName,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
          status: form.status,
          role: form.role,
          permissions: form.permissions,
          createdBy: "SUPER_ADMIN_UI"
        });
      }
      close();
    } catch (err) {
      console.error(err);
      alert("Save failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[95%] max-w-4xl p-6 rounded-xl shadow-lg overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">{editUser ? "Edit User" : "Add User"}</h3>
          <button onClick={close}>✖</button>
        </div>

        {/* USER FIELDS */}
        <div className="grid grid-cols-2 gap-4">
          <input className="w-full px-4 py-3 border border-blue-300 rounded" placeholder="Full name" value={form.fullName} onChange={e=>setForm({...form, fullName:e.target.value})} />
          <input className="w-full px-4 py-3 border border-blue-300 rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input className="w-full px-4 py-3 border border-blue-300 rounded" placeholder="Mobile" value={form.mobile} onChange={e=>setForm({...form, mobile:e.target.value})} />
          <select className="w-full px-4 py-3 border border-blue-300 rounded" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
            <option>Active</option><option>Inactive</option>
          </select>

          <select className="w-full px-4 py-3 border border-blue-300 rounded" value={form.role} onChange={e=>applyRoleDefaults(e.target.value)}>
            {ROLES.map(r => <option key={r}>{r}</option>)}
          </select>

          {!editUser && (
            <>
              <input type="password" className="w-full px-4 py-3 border border-blue-300 rounded" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <input type="password" className="w-full px-4 py-3 border border-blue-300 rounded" placeholder="Confirm password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})} />
            </>
          )}
        </div>

        {/* PERMISSION MATRIX */}
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Permission Matrix (edit as needed)</h4>
          <div className="overflow-x-auto border rounded">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Module</th>
                  <th className="p-2 text-center">View</th>
                  <th className="p-2 text-center">Create</th>
                  <th className="p-2 text-center">Edit</th>
                  <th className="p-2 text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {MODULES.map(m => (
                  <tr key={m} className="border-t">
                    <td className="p-2">{m}</td>
                    {["view","create","edit","delete"].map(k => (
                      <td key={k} className="p-2 text-center">
                        <input type="checkbox" checked={!!form.permissions[m]?.[k]} onChange={() => toggle(m,k)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 border rounded" onClick={close}>Cancel</button>
          <button className="px-5 py-2 bg-blue-700 text-white rounded" onClick={save} disabled={loading}>{loading ? "Saving..." : "Save User"}</button>
        </div>
      </div>
    </div>
  );
}
