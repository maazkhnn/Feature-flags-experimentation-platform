import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="font-bold text-lg">Feature Flags</h1>
      <div className="space-x-2">
        <Button asChild variant="outline">
          <Link to="/admin">Admin</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/demo">Demo</Link>
        </Button>
      </div>
    </nav>
  );
}