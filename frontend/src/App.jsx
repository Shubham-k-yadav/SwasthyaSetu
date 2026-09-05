import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { LanguageProvider } from '@/lib/language-context';
import { Toaster } from 'sonner';

import HomePage from '@/pages/HomePage';
import HospitalsPage from '@/pages/HospitalsPage';
import BloodPage from '@/pages/BloodPage';
import EmergencyPage from '@/pages/EmergencyPage';
import DriverLocationPage from '@/pages/DriverLocationPage';
import RegisterPage from '@/pages/RegisterPage';

import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminHospitalsPage from '@/pages/admin/AdminHospitalsPage';
import AdminBloodPage from '@/pages/admin/AdminBloodPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';
import SuperAdminDashboard from '@/pages/admin/SuperAdminDashboard';
import HospitalAdminDashboard from '@/pages/admin/HospitalAdminDashboard';
import { useAuth } from '@/lib/auth-context';

function AdminDashboardDispatcher() {
  const { user } = useAuth();
  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }
  return <HospitalAdminDashboard />;
}

import { PwaInstallBanner } from '@/components/PwaInstallBanner';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { ScrollToTop } from '@/components/ScrollToTop';

// Robust Error Boundary to catch any page-level rendering issues
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page rendering error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
          <div className="max-w-md rounded-2xl bg-white p-6 shadow-xl border dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              An unexpected rendering issue occurred on this page.
            </p>
            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-mono text-red-700 dark:text-red-300 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
                className="rounded-lg bg-slate-200 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                Go to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <PwaInstallBanner />
          <ErrorBoundary>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/hospitals" element={<HospitalsPage />} />
              <Route path="/blood" element={<BloodPage />} />
              <Route path="/emergency" element={<EmergencyPage />} />
              <Route path="/driver/:ambulanceId" element={<DriverLocationPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/:type" element={<RegisterPage />} />

              {/* Admin Authentication */}
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Admin Protected Dashboard */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardDispatcher />} />
                <Route path="hospitals" element={<AdminHospitalsPage />} />
                <Route path="blood" element={<AdminBloodPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Routes>
          </ErrorBoundary>
          {/* Global Mobile Bottom Navigation Bar on all mobile screens */}
          <MobileBottomNav />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
