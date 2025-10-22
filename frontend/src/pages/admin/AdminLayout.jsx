import React, { useContext, useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthContext } from "../../contexts/auth.context.jsx";
import AdminSidebar from "../../components/admin/AdminSidebar.jsx";
import { useState } from "react";

const AdminLayout = () => {
  const { currentUser, fetchProfile } = useContext(AuthContext);
  const [redirect, setRedirect] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (!currentUser) fetchProfile();
  }, [currentUser, fetchProfile]);

  if (currentUser === null) {
    setTimeout(() => {
      if (!currentUser) {
        console.log("AdminLayout: User not found, redirecting to homepage");
        setRedirect(<Navigate to="/" replace />);
      } else {
        console.log("AdminLayout: User found");
      }
    }, 2000);
    return redirect;
  }

  if (currentUser?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="bg-page-sky min-h-screen w-full flex">
      <AdminSidebar />
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
