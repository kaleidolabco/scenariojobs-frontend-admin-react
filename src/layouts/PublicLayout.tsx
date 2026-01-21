import React from "react";
import { Outlet } from "react-router-dom";

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
};

export default PublicLayout;
