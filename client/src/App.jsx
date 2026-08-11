import React from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">

      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Right Side */}
      <div className="ml-[240px]">

        {/* Fixed Navbar */}
        <Navbar
          userName="Bhavana"
          userRole="Student"
        />

        {/* Scrollable Content */}
        <main className="fixed top-16 bottom-14 left-[240px] right-0 overflow-y-auto bg-gray-100">

          {/* Your page content */}
          <div className="bg-white  p-6 min-h-[1000px]">
            <h1 className="text-2xl font-bold">
              CampusOne Dashboard
            </h1>

            <p className="mt-4 text-gray-600">
              Welcome to CampusOne-AI....
            </p>
          </div>

        </main>

        {/* Fixed Footer */}
        <Footer />

      </div>

    </div>
  );
}

export default App;