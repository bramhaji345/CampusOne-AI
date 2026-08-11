import React from "react";
import {
  LayoutDashboard,
  Bot,
  UserCheck,
  GraduationCap,
  FileText,
  Calendar,
  ClipboardList,
  Bell,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="fixed top-0 left-0 w-[240px] h-screen bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-50">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-[24px] font-bold text-[#1E3A8A] leading-none">
          CampusOne
        </h1>
        <span className="text-[#3B82F6] font-semibold text-sm">AI</span>
      </div>

      {/* Overview */}
      <div className="px-4 mt-2">
        <p className="text-[11px] font-semibold text-gray-400 mb-3">
          OVERVIEW
        </p>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md bg-blue-50 text-blue-600">
            <LayoutDashboard size={18} />
            <span className="text-sm">Dashboard</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <Bot size={18} />
            <span className="text-sm">AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Academics */}
      <div className="px-4 mt-3">
        <p className="text-[11px] font-semibold text-gray-400 mb-3">
          ACADEMICS
        </p>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <UserCheck size={18} />
            <span className="text-sm">Attendance</span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <GraduationCap size={18} />
            <span className="text-sm">Results & Grades</span>
          </button>

          <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <div className="flex items-center gap-3">
              <FileText size={18} />
              <span className="text-sm">Assignments</span>
            </div>

            <span className="w-5 h-5 rounded-full  text-white text-[10px] flex items-center justify-center">
              
            </span>
          </button>

          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <Calendar size={18} />
            <span className="text-sm">Timetable</span>
          </button>
        </div>
      </div>

      {/* Requests */}
      <div className="px-4 mt-3">
        <p className="text-[11px] font-semibold text-gray-400 mb-3">
          REQUESTS
        </p>

        <div className="space-y-1">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <div className="flex items-center gap-3">
              <ClipboardList size={18} />
              <span className="text-sm">Leave / Outpass</span>
            </div>

            <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center">
              1
            </span>
          </button>

          <button className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100">
            <div className="flex items-center gap-3">
              <Bell size={18} />
              <span className="text-sm">Notifications</span>
            </div>

            <span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center">
              
            </span>
          </button>
        </div>
      </div>

      {/* Profile & Sign Out */}
      <div className="mt-auto border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
            AR
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-800">
              Arjun Rathod
            </h4>
            <p className="text-xs text-gray-500">Student</p>
          </div>
        </div>

        <button className="mt-4 flex items-center gap-3 text-gray-600 hover:text-gray-800">
          <LogOut size={18} />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
