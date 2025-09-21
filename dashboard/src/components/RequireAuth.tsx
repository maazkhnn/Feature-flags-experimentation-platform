import { Navigate, Outlet } from "react-router-dom";

export default function RequireAuth() {
    const token = localStorage.getItem("ff_jwt");
    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
}
