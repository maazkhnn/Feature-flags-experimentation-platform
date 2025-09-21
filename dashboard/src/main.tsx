import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import AdminPage from "./pages/AdminPage";
import SegmentsPage from "./pages/SegmentsPage";
import AuditPage from "./pages/AuditPage";
import DemoPage from "./pages/DemoPage";
import LoginPage from "./pages/LoginPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import RequireAuth from "./components/RequireAuth";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Protected admin routes */}
        <Route element={<RequireAuth />}>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/segments" element={<SegmentsPage />} />
          <Route path="/audit" element={<AuditPage />} />
        </Route>
        {/* Public demo */}
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/demo" element={<DemoPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

