import React, { Suspense, lazy } from "react";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy Load Pages for Performance
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const RoleBasedDashboard = lazy(() => import("./components/RoleBasedDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const TournamentDetails = lazy(() => import("./pages/TournamentDetails"));
const BracketManager = lazy(() => import("./pages/BracketManager"));
const StatsManager = lazy(() => import("./pages/StatsManager"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs"));

function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/contact-us" element={<ContactUs />} />

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            {/* MAIN ROUTE: Automatically decides Admin vs User */}
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <RoleBasedDashboard />
                </PrivateRoute>
              } 
            />

            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/leaderboard" element={<PrivateRoute><Leaderboard /></PrivateRoute>} />
            <Route path="/tournament/:id" element={<PrivateRoute><TournamentDetails /></PrivateRoute>} />
            <Route path="/brackets" element={<PrivateRoute><BracketManager /></PrivateRoute>} />
            <Route path="/stats" element={<PrivateRoute><StatsManager /></PrivateRoute>} />

          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}

export default App;