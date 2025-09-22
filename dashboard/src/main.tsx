import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import SegmentsPage from "./pages/SegmentsPage";
import AuditPage from "./pages/AuditPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import TourPage from "./pages/TourPage";
import RequireAuth from "./components/RequireAuth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Everything below gets the shared Navbar */}
        <Route element={<RootLayout />}>
          <Route path="/" element={<App />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/tour" element={<TourPage />} />
          {/* Protected admin routes */}
          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/segments" element={<SegmentsPage />} />
            <Route path="/audit" element={<AuditPage />} />
          </Route>
        </Route>

        {/* Keep login outside the layout if you want a clean page */}
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

