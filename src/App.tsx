import Logo from "./components/Logo";
import { LandingPage } from "./components/LandingPageNew";
import Navbar from "./components/Navbar";
import { User } from "./types";
import { Toaster } from "sonner";
import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "./contexts/LanguageContext";
import { translations } from "./translations";
import { useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";

// Lazy load pages for optimum initial bundle size and near-instant load speed
const CustomerScanPage = React.lazy(() => import("./pages/CustomerScan"));
const ForgotPasswordPage = React.lazy(() => import("./pages/ForgotPassword"));
const RegisterPage = React.lazy(() => import("./pages/RegisterPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const OrderTrackingPage = React.lazy(() => import("./pages/OrderTrackingPage"));
const ReturnExchangePage = React.lazy(() => import("./pages/ReturnExchange"));
const GuestCheckoutPage = React.lazy(() => import("./pages/GuestCheckoutPage"));
const LoginPage = React.lazy(() => import("./pages/Login"));
const ResetPasswordPage = React.lazy(() => import("./pages/ResetPassword"));
const SuperAdminDashboard = React.lazy(() => import("./pages/SuperAdmin"));
const PublicQuotation = React.lazy(() => import("./pages/PublicQuotation"));
const CheckoutStatus = React.lazy(() => import("./pages/CheckoutStatus"));
const DirectCheckoutRedirect = React.lazy(() => import("./pages/DirectCheckoutRedirect"));
const PaymentGatewayPage = React.lazy(() => import("./pages/PaymentGatewayPage"));
const StoreShowcase = React.lazy(() => import("./pages/StoreShowcase"));
const Marketplace = React.lazy(() => import("./pages/Marketplace").then(m => ({ default: m.Marketplace })));
const StoreDashboard = React.lazy(() => import("./pages/StoreDashboard/index"));

const SuspenseLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-semibold text-slate-500 animate-pulse">Yükleniyor...</p>
    </div>
  </div>
);

// --- Types ---
// User interface is imported from ./types

const NavigateWithParams = () => {
  const { slug } = useParams();
  return <Navigate to={`/scan/${slug}`} replace />;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useLanguage();
  const initialHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const [detectedSlug, setDetectedSlug] = useState<string | null>(() => {
    if (initialHostname === "enrakipsiz.com" || initialHostname === "www.enrakipsiz.com") return "__portal__";
    return null;
  });
  const [isCheckingDomain, setIsCheckingDomain] = useState(() => {
    if (!initialHostname) return false;
    if (initialHostname === "enrakipsiz.com" || initialHostname === "www.enrakipsiz.com") return false;
    const mainDomains = [
      "lookprice.net",
      "www.lookprice.net",
      "ais-dev-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
      "ais-pre-fw5matlno23z7prjfvwxwu-416165499277.europe-west2.run.app",
      "localhost",
      "0.0.0.0",
      "onrender.com"
    ];
    const isMainDomain = mainDomains.some(d => initialHostname.includes(d)) || 
                        initialHostname.includes(".run.app") || 
                        initialHostname.includes(".google.com") ||
                        initialHostname.includes("webcontainer");
    return !isMainDomain;
  });

  useEffect(() => {
    if (!isCheckingDomain) return; // Skip if already determined synchronously to be on main domain

    const checkDomain = async () => {
      const hostname = window.location.hostname;
      try {
        const res = await fetch(`/api/public/stores/by-domain?domain=${hostname}`);
        if (res.ok) {
          const data = await res.json();
          setDetectedSlug(data.slug);
        }
      } catch (e) {
        console.error("Domain detection failed", e);
      } finally {
        setIsCheckingDomain(false);
      }
    };

    checkDomain();
  }, [isCheckingDomain]);

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

  if (isCheckingDomain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  // If we are on a custom domain, we treat the root and other paths as store paths
  if (detectedSlug && !location.pathname.startsWith('/api') && !location.pathname.startsWith('/admin')) {
    // Special case for Mega Portal (Enrakipsiz.com)
    if (detectedSlug === "__portal__") {
      return (
        <div className="min-h-screen bg-gray-50 font-sans">
          <React.Suspense fallback={<SuspenseLoader />}>
            <Routes>
              <Route path="*" element={<Marketplace />} />
            </Routes>
          </React.Suspense>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <React.Suspense fallback={<SuspenseLoader />}>
          <Routes>
            {/* Scan Routes */}
            <Route path="/scan/:slug?" element={<CustomerScanPage customSlug={detectedSlug || undefined} />} />
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/profile" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="/orders" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="/return" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="/checkout/success" element={<CheckoutStatus />} />
            <Route path="/checkout/cancel" element={<CheckoutStatus />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/s/:slug/p/:barcode" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="/p/:barcode" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="/s/:slug" element={<StoreShowcase customSlug={detectedSlug} />} />
            <Route path="*" element={<StoreShowcase customSlug={detectedSlug} />} />
          </Routes>
        </React.Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Toaster position="top-center" richColors />
      <React.Suspense fallback={<SuspenseLoader />}>
        <Routes>
            {/* Public Routes */}
            <Route path="/scan/:slug" element={<CustomerScanPage />} />
            <Route path="/s/:slug" element={<StoreShowcase />} />
            <Route path="/s/:slug/p/:barcode" element={<StoreShowcase />} />
            <Route path="/store/:slug" element={<StoreShowcase />} />
            <Route path="/store/:slug/p/:barcode" element={<StoreShowcase />} />
            <Route path="/checkout/success" element={<CheckoutStatus />} />
            <Route path="/checkout/cancel" element={<CheckoutStatus />} />
            <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
            <Route path="/s/:slug/quotation/:id" element={<PublicQuotation />} />
            <Route path="/quotation/:id" element={<PublicQuotation />} />
            <Route path="/s/:slug/checkout" element={<GuestCheckoutPage />} />
            <Route path="/guest-checkout-public" element={<GuestCheckoutPage />} />
            <Route path="/s/:slug/direct-checkout" element={<DirectCheckoutRedirect />} />
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
            <Route path="/s/:slug/profile" element={<StoreShowcase />} />
            <Route path="/orders" element={
              token ? (
                <OrderTrackingPage />
              ) : <Navigate to="/login" />
            } />
            <Route path="/s/:slug/orders" element={<StoreShowcase />} />
            <Route path="/return" element={
              token ? (
                <ReturnExchangePage />
              ) : <Navigate to="/login" />
            } />
            <Route path="/s/:slug/return" element={<StoreShowcase />} />
            <Route path="/guest-checkout" element={
              token ? (
                <GuestCheckoutPage />
              ) : <Navigate to="/login" />
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
              <LandingPage />
            } />
            
            <Route path="/portal" element={
              <Marketplace />
            } />
        </Routes>
      </React.Suspense>
    </div>
  );
}
