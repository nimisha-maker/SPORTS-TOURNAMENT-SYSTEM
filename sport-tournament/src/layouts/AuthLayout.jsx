import React from "react";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-black-900 via-blue-800 to-black-700 p-6">
      <div className="relative w-full max-w-md bg-blue/5 backdrop-blur-2xl shadow-2xl rounded-3xl p-10">
        {/* Decorative gradient circles */}
        <div className="absolute -top-1 -left-16 w-40 h-40 bg-linear-to-tr from-pink-500 to-purple-600 rounded-full opacity-30 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-6 -right-10 w-72 h-72 bg-linear-to-tr from-yellow-400 to-red-500 rounded-full opacity-20 blur-3xl animate-pulse"></div>

        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
