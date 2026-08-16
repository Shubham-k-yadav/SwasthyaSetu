 import { Link } from 'react-router-dom';
import {
  Building2,
  Droplets,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,

  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';






















// Mock data for demo
const mockStats = {
  totalHospitals: 156,
  activeEmergencies: 8,
  totalBeds: 12450,
  availableBeds: 3240,
  bloodUnitsAvailable: 4580,
  criticalBloodTypes: ['O-', 'AB-'],
  registeredDonors: 8920,
  todayRequests: 47,
  verifiedRecords: 98.5,
};

const mockActivities = [
  {
    id: '1',
    type: 'emergency',
    message: 'New emergency request for 3 ICU beds',
    hospital: 'City General Hospital',
    timestamp: new Date(Date.now() - 5 * 60000),
    status: 'critical',
  },
  {
    id: '2',
    type: 'blood_request',
    message: 'Urgent need for 4 units of O- blood',
    hospital: 'Apollo Hospital, Mumbai',
    timestamp: new Date(Date.now() - 12 * 60000),
    status: 'pending',
  },
  {
    id: '3',
    type: 'bed_update',
    message: 'Updated bed availability: 45 general, 12 ICU',
    hospital: 'AIIMS Delhi',
    timestamp: new Date(Date.now() - 25 * 60000),
    status: 'success',
  },
  {
    id: '4',
    type: 'verification',
    message: 'Blockchain verification completed for 25 records',
    timestamp: new Date(Date.now() - 45 * 60000),
    status: 'success',
  },
  {
    id: '5',
    type: 'donor_registration',
    message: '12 new donors registered in Mumbai region',
    timestamp: new Date(Date.now() - 60 * 60000),
    status: 'success',
  },
];

const bloodTypeDistribution = [
  { type: 'A+', units: 850, percentage: 28 },
  { type: 'A-', units: 180, percentage: 6 },
  { type: 'B+', units: 720, percentage: 24 },
  { type: 'B-', units: 150, percentage: 5 },
  { type: 'AB+', units: 320, percentage: 11 },
  { type: 'AB-', units: 80, percentage: 3 },
  { type: 'O+', units: 650, percentage: 22 },
  { type: 'O-', units: 45, percentage: 1 },
];

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
}







) {
  const variants = {
    default: 'bg-card',
    primary: 'bg-primary/5 border-primary/20',
    warning: 'bg-amber-500/5 border-amber-500/20',
    success: 'bg-emerald-500/5 border-emerald-500/20',
  };

  const iconVariants = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    warning: 'bg-amber-500/10 text-amber-600',
    success: 'bg-emerald-500/10 text-emerald-600',
  };

  return (
    <Card className={cn('overflow-hidden', variants[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{value}</p>
              {trend && trendValue && (
                <span
                  className={cn(
                    'flex items-center text-xs font-medium',
                    trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {trendValue}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn('p-3 rounded-xl', iconVariants[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }) {
  const statusIcons = {
    success: CheckCircle2,
    pending: Clock,
    critical: AlertTriangle,
  };

  const statusColors = {
    success: 'text-emerald-600',
    pending: 'text-amber-600',
    critical: 'text-red-600',
  };

  const StatusIcon = statusIcons[activity.status];

  const formatTime = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 py-3">
      <div
        className={cn(
          'p-1.5 rounded-full',
          activity.status === 'critical'
            ? 'bg-red-100'
            : activity.status === 'pending'
              ? 'bg-amber-100'
              : 'bg-emerald-100'
        )}
      >
        <StatusIcon className={cn('h-4 w-4', statusColors[activity.status])} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{activity.message}</p>
        {activity.hospital && (
          <p className="text-xs text-muted-foreground mt-0.5">{activity.hospital}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {formatTime(activity.timestamp)}
      </span>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);
  const [activities, setActivities] = useState(mockActivities);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveStats = async () => {
    try {
      const [hospStats, bloodStats] = await Promise.all([
        api.hospitals.getStats().catch(() => null),
        api.blood.getStats().catch(() => null),
      ]);

      if (hospStats) {
        const beds = hospStats.beds || {};
        const totalBeds = (beds.totalICU || 0) + (beds.totalGeneral || 0) + (beds.totalVentilator || 0);
        const availBeds = (beds.availableICU || 0) + (beds.availableGeneral || 0) + (beds.availableVentilator || 0);

        setStats(prev => ({
          ...prev,
          totalHospitals: hospStats.totalHospitals || prev.totalHospitals,
          totalBeds: totalBeds || prev.totalBeds,
          availableBeds: availBeds || prev.availableBeds,
          bloodUnitsAvailable: bloodStats?.totalUnits || prev.bloodUnitsAvailable,
          criticalBloodTypes: bloodStats?.criticalGroups || prev.criticalBloodTypes,
        }));
      }
    } catch (err) {
      console.warn('Backend offline, using fallback admin stats:', err);
    }
  };

  useEffect(() => {
    fetchLiveStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLiveStats();
    setIsRefreshing(false);
  };

  const bedOccupancyRate = stats.totalBeds > 0
    ? Math.round(((stats.totalBeds - stats.availableBeds) / stats.totalBeds) * 100)
    : 72;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of the SwasthyaSetu emergency network
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
          <RefreshCw className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')} />
          Refresh Data
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Hospitals"
          value={stats.totalHospitals}
          subtitle="Across 28 states"
          icon={Building2}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          title="Active Emergencies"
          value={stats.activeEmergencies}
          subtitle="Requiring immediate attention"
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Available Beds"
          value={stats.availableBeds.toLocaleString()}
          subtitle={`${stats.totalBeds.toLocaleString()} total capacity`}
          icon={Activity}
          trend="down"
          trendValue="3%"
          variant="primary"
        />
        <StatCard
          title="Blood Units"
          value={stats.bloodUnitsAvailable.toLocaleString()}
          subtitle={`${stats.criticalBloodTypes.join(', ')} critically low`}
          icon={Droplets}
          variant="success"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Bed Occupancy */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Key metrics and resource utilization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bed Occupancy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Bed Occupancy Rate</span>
                <span className="text-muted-foreground">{bedOccupancyRate.toFixed(1)}%</span>
              </div>
              <Progress value={bedOccupancyRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stats.availableBeds.toLocaleString()} available</span>
                <span>{(stats.totalBeds - stats.availableBeds).toLocaleString()} occupied</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Registered Donors
                </div>
                <p className="text-2xl font-bold mt-1">{stats.registeredDonors.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="h-4 w-4" />
                  {"Today's Requests"}
                </div>
                <p className="text-2xl font-bold mt-1">{stats.todayRequests}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified Records
                </div>
                <p className="text-2xl font-bold mt-1">{stats.verifiedRecords}%</p>
              </div>
            </div>

            {/* Blood Type Distribution */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Blood Type Distribution</h4>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {bloodTypeDistribution.map((blood) => (
                  <div
                    key={blood.type}
                    className={cn(
                      'p-2 rounded-lg text-center',
                      blood.units < 100
                        ? 'bg-red-50 border border-red-200'
                        : blood.units < 300
                          ? 'bg-amber-50 border border-amber-200'
                          : 'bg-emerald-50 border border-emerald-200'
                    )}
                  >
                    <p className="font-bold text-sm">{blood.type}</p>
                    <p className="text-xs text-muted-foreground">{blood.units}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from the network</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4" asChild>
              <Link to="/admin/emergencies">
                View all activity
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/hospitals">
                <Building2 className="h-5 w-5" />
                <span>Manage Hospitals</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/blood">
                <Droplets className="h-5 w-5" />
                <span>Update Blood Stock</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/donors">
                <Users className="h-5 w-5" />
                <span>View Donors</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link to="/admin/emergencies">
                <AlertTriangle className="h-5 w-5" />
                <span>Emergency Queue</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
