import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

import HomePage from '@/pages/HomePage';
import HospitalsPage from '@/pages/HospitalsPage';
import BloodPage from '@/pages/BloodPage';
import EmergencyPage from '@/pages/EmergencyPage';
import ContactPage from '@/pages/ContactPage';

import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminHospitalsPage from '@/pages/admin/AdminHospitalsPage';
import AdminBloodPage from '@/pages/admin/AdminBloodPage';
import AdminDonorsPage from '@/pages/admin/AdminDonorsPage';
import AdminEmergenciesPage from '@/pages/admin/AdminEmergenciesPage';
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/hospitals" element={<HospitalsPage />} />
          <Route path="/blood" element={<BloodPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Admin Authentication */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="hospitals" element={<AdminHospitalsPage />} />
            <Route path="blood" element={<AdminBloodPage />} />
            <Route path="donors" element={<AdminDonorsPage />} />
            <Route path="emergencies" element={<AdminEmergenciesPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
