import Navbar from "@/components/ui/navbar";

export default function App() {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="p-6">
          <h2 className="text-xl">Welcome to the Feature Flags platform.</h2>
          <p>Choose <strong>Admin</strong>, <strong>Segments</strong>, <strong>Audit</strong>, <strong>Playground</strong>, or <strong>Demo</strong> above.</p>
        </div>
      </div>
    );
}
