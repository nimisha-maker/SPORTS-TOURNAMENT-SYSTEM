import { useEffect, useState } from "react";
import axios from "axios";
import AddUser from "../user_roles/Adduser";
import { Pencil, Trash2, Key } from "lucide-react";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const load = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/users/all");
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    await axios.delete(`http://localhost:5000/api/users/delete/${id}`);
    load();
  };

  const reset = async (id) => {
    if (!confirm("Reset password for this user?")) return;
    const res = await axios.post(`http://localhost:5000/api/users/reset-password/${id}`);
    alert("Temporary password: " + (res.data?.tempPassword || "sent"));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-blue-700">User Management</h2>
        <button className="bg-blue-700 text-white px-4 py-2 rounded" onClick={() => { setEditUser(null); setShowForm(true); }}>
          + Add User
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border overflow-x-auto">
        <table className="w-full text-left min-w-[900px]">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Mobile</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
              <th className="py-2">Last Login</th>
              <th className="py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                <td className="py-3 font-medium">{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.mobile}</td>
                <td>{u.role}</td>
                <td className={u.status==="Active" ? "text-green-600" : "text-red-600"}>{u.status}</td>
                <td>{u.lastLogin || "—"}</td>
                <td className="py-2 flex justify-center gap-3">
                  <Pencil size={18} className="cursor-pointer" onClick={() => { setEditUser(u); setShowForm(true); }} />
                  <Key size={18} className="cursor-pointer" onClick={() => reset(u.id)} />
                  <Trash2 size={18} className="cursor-pointer" onClick={() => remove(u.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && <AddUser close={() => { setShowForm(false); load(); }} editUser={editUser} />}
    </div>
  );
}
