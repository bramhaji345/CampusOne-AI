import React, { useState } from "react";
import {
  Search,
  Bell,
  MessageCircle,
  ChevronDown,
  User,
  Settings,
  KeyRound,
  Languages,
  LogOut,
} from "lucide-react";

const Navbar = ({
  userName = "Bhavana",
  userRole = "Student",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">

      {/* Logo */}
      <div>
        <h1 className="text-2xl font-bold text-blue-700">
          CampusOne <span className="text-blue-500">AI</span>
        </h1>
      </div>

      {/* Search */}
      <div className="hidden md:flex flex-1 justify-center px-10">
        <div className="relative w-full max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-3 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search..."
            className="w-full h-10 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        {/* Messages */}
        <button className="relative">
          <MessageCircle size={22} />
          <span className="absolute -top-2 -right-2  text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">
            
          </span>
        </button>

        {/* Notifications */}
        <button className="relative">
          <Bell size={22} />
          <span className="absolute -top-2 -right-2 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center">
            
          </span>
        </button>

        {/* Profile */}
        <div className="relative">

          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {userName.charAt(0)}
            </div>

            <div className="hidden md:block text-left">
              <h4 className="text-sm font-semibold">
                {userName}
              </h4>

              <p className="text-xs text-gray-500">
                {userRole}
              </p>
            </div>

            <ChevronDown size={18} />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border">

              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
                <User size={18} />
                My Profile
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
                <Settings size={18} />
                Settings
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
                <KeyRound size={18} />
                Change Password
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100">
                <Languages size={18} />
                Language
              </button>

              <hr />

              <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50">
                <LogOut size={18} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
};
export default Navbar;
