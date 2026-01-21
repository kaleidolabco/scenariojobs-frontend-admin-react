import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Dashboard/Navbar";
import Sidebar from "../components/Dashboard/Sidebar";

const DashboardLayout: React.FC = () => {
  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle peer" defaultChecked />
      
      {/* Page Content */}
      <div className="drawer-content flex flex-col h-screen">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 bg-base-200">
          <Outlet />
        </main>
      </div> 
      
      {/* Sidebar */}
      <Sidebar />
    </div>
  );
};

export default DashboardLayout;
