import { Outlet } from "react-router-dom";
import Navbar from "@/components/ui/navbar";

export default function RootLayout() {
    return (
        <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="p-6">
            <Outlet />
        </div>
        </div>
    );
}
