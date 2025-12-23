// src/layouts/AdminLayout.jsx
import Sidebar from "../components/user_sidebar.jsx";
import Header from "../components/user_header.jsx";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F4F8FF]">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
