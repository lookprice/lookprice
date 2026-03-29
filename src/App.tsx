import CustomerScanPage from "./pages/CustomerScan.tsx";
import ForgotPasswordPage from "./pages/ForgotPassword.tsx";
import LoginPage from "./pages/Login.tsx";
import ResetPasswordPage from "./pages/ResetPassword.tsx";
import SuperAdminDashboard from "./pages/SuperAdmin.tsx";
import PublicQuotation from "./pages/PublicQuotation.tsx";
import StoreShowcase from "./pages/StoreShowcase.tsx";
import Logo from "./components/Logo.tsx";
import { LandingPage } from "./components/LandingPage.tsx";
import StoreDashboard from "./pages/StoreDashboard/index.tsx";
import Navbar from "./components/Navbar.tsx";
import { User } from "./types";
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext.tsx";
import { translations } from "./translations.ts";
import { useParams } from "react-router-dom";

// --- Types ---
// User interface is imported from ./types

const NavigateWithParams = () => {
  const { slug } = useParams();
  return <Navigate to={`/scan/${slug}`} replace />;
};

export default function App() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    document.title = translations[lang].meta.title;
    document.documentElement.lang = lang;
  }, [lang]);

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("token");
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage", e);
      return null;
    }
  });

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    
    // Redirect based on role and store
    if (newUser.role === 'superadmin') {
      navigate("/admin");
    } else if (newUser.store_slug) {
      navigate(`/dashboard/${newUser.store_slug}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Routes>
          {/* Public Routes */}
          <Route path="/scan/:slug" element={<CustomerScanPage />} />
          <Route path="/s/:slug" element={<StoreShowcase />} />
          <Route path="/store/:slug" element={<StoreShowcase />} />
          <Route path="/quotation/:id" element={<PublicQuotation />} />
          <Route path="/forgot-password" element={
            <>
              <Navbar user={null} onLogout={handleLogout} />
              <ForgotPasswordPage />
            </>
          } />
          <Route path="/reset-password/:token" element={
            <>
              <Navbar user={null} onLogout={handleLogout} />
              <ResetPasswordPage />
            </>
          } />
          
          {/* Auth Routes */}
          <Route path="/login" element={
            token ? (
              user?.role === 'superadmin' ? <Navigate to="/admin" /> : 
              user?.store_slug ? <Navigate to={`/dashboard/${user.store_slug}`} /> : <Navigate to="/dashboard" />
            ) : (
              <>
                <Navbar user={null} onLogout={handleLogout} />
                <LoginPage onLogin={handleLogin} />
              </>
            )
          } />

          {/* Protected Routes */}
          <Route path="/dashboard/:slug?" element={
            token && user ? (
              <StoreDashboard user={user} onLogout={handleLogout} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin" element={
            token && user?.role === 'superadmin' ? (
              <SuperAdminDashboard token={token} onLogout={handleLogout} />
            ) : <Navigate to="/login" />
          } />

          <Route path="/" element={
            <>
              <Navbar user={token ? user : null} onLogout={handleLogout} />
              <LandingPage />
            </>
          } />
        </Routes>
      </div>
  );
}
