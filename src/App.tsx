import CustomerScanPage from "./pages/CustomerScan";
import ForgotPasswordPage from "./pages/ForgotPassword";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import ReturnExchangePage from "./pages/ReturnExchange";
import GuestCheckoutPage from "./pages/GuestCheckoutPage";
import LoginPage from "./pages/Login";
import ResetPasswordPage from "./pages/ResetPassword";
import SuperAdminDashboard from "./pages/SuperAdmin";
import PublicQuotation from "./pages/PublicQuotation";
import StoreShowcase from "./pages/StoreShowcase";
import Logo from "./components/Logo";
import { LandingPage } from "./components/LandingPageNew";
import StoreDashboard from "./pages/StoreDashboard/index";
import Navbar from "./components/Navbar";
import { User } from "./types";
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={
            token ? (
              user?.role === 'superadmin' ? <Navigate to="/admin" /> : 
              user?.store_slug ? <Navigate to={`/dashboard/${user.store_slug}`} /> : <Navigate to="/dashboard" />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          } />
          <Route path="/register" element={
            token ? (
              user?.role === 'superadmin' ? <Navigate to="/admin" /> : 
              user?.store_slug ? <Navigate to={`/dashboard/${user.store_slug}`} /> : <Navigate to="/dashboard" />
            ) : (
              <RegisterPage />
            )
          } />
          <Route path="/profile" element={
            token ? (
              <ProfilePage />
            ) : <Navigate to="/login" />
          } />
          <Route path="/orders" element={
            token ? (
              <OrderTrackingPage />
            ) : <Navigate to="/login" />
          } />
          <Route path="/return" element={
            token ? (
              <ReturnExchangePage />
            ) : <Navigate to="/login" />
          } />
          <Route path="/guest-checkout" element={<GuestCheckoutPage />} />

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
            <LandingPage />
          } />
        </Routes>
      </div>
  );
}
