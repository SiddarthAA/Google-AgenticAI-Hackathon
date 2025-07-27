import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthRedirect from "./pages/AuthPage";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import HomePage from "./pages/HomePage"; // your home page after login
import RadioPage from "./pages/RadioPage";
import RewardsPage from "./pages/RewardsPage";
import ReportIssuePage from "./pages/ReportIssuePage";
import LandingPage from "./pages/LandingPage";
import "./index.css";
import NewsStoriesPage from "./pages/NewsPage";
import ProfilePage from "./pages/ProfilePage";
import GeminiImageSummaryPage from "./pages/ImageSummarizerPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* Auth page (login/signup) */}
        <Route path="/auth" element={<AuthRedirect />} />
        {/* Home page */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/radio"
          element={
            <ProtectedRoute>
              <RadioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <RewardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report"
          element={
            <ProtectedRoute>
              <ReportIssuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute>
              <NewsStoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary"
          element={
            <ProtectedRoute>
              <GeminiImageSummaryPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
