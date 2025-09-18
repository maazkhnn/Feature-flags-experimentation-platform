import { Button } from "@/components/ui/button";
import Navbar from "@/components/ui/navbar";

export default function App() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-100">
      <Navbar />
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-blue-600">
          Feature Flags Dashboard
        </h1>

        {/* Try both default and outline (outline helps even if theme vars are missing) */}
        <div className="flex items-center justify-center gap-4">
          <Button>Default Button</Button>
          <Button variant="outline">Outline Button</Button>
        </div>
      </div>
    </div>
  );
}
