import { useAuth } from '@/lib/auth-context';
import SuperAdminDashboard from './SuperAdminDashboard';
import HospitalAdminDashboard from './HospitalAdminDashboard';

export default function AdminDashboard() {
  const { user } = useAuth();

  if (user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  return <HospitalAdminDashboard />;
}
