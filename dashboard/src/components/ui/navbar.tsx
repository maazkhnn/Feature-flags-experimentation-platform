import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Rocket } from "lucide-react";
import { isAuthed, clearToken, onAuthChange } from "@/lib/auth";

export default function Navbar() {
  const [authed, setAuthed] = useState(isAuthed());
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => onAuthChange(() => setAuthed(isAuthed())), []);

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <h1 className="font-bold text-lg">Feature Flags</h1>
      <div className="space-x-2">
        <Button asChild variant="outline"><Link to="/demo">Demo</Link></Button>
          <Button asChild variant={"default"}>
            <Link to="/tour">
              <Rocket className="mr-2 h-4 w-4" /> Live Tour
            </Link>
          </Button>
        <Button asChild variant="outline"><Link to="/admin">Admin</Link></Button>
        <Button asChild variant="outline"><Link to="/segments">Segments</Link></Button>
        {authed ? (
          <Button
            variant="destructive"
            onClick={() => { clearToken(); if (loc.pathname.startsWith("/admin")) nav("/"); }}
          >
            Sign out
          </Button>
        ) : (
          <Button asChild><Link to="/login">Sign in</Link></Button>
        )}
      </div>
    </nav>
  );
}
