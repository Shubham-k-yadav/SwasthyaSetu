
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {

  TrendingUp,
  TrendingDown,
  Users,
  Building2,

  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock data for charts
const emergencyTrends = [
  { month: 'Jan', requests: 245, resolved: 238, avgTime: 12 },
  { month: 'Feb', requests: 312, resolved: 305, avgTime: 11 },
  { month: 'Mar', requests: 289, resolved: 280, avgTime: 10 },
  { month: 'Apr', requests: 378, resolved: 365, avgTime: 9 },
  { month: 'May', requests: 421, resolved: 412, avgTime: 8 },
  { month: 'Jun', requests: 356, resolved: 348, avgTime: 9 },
];

const bedOccupancy = [
  { day: 'Mon', icu: 85, general: 72, emergency: 90 },
  { day: 'Tue', icu: 88, general: 75, emergency: 85 },
  { day: 'Wed', icu: 82, general: 70, emergency: 88 },
  { day: 'Thu', icu: 90, general: 78, emergency: 92 },
  { day: 'Fri', icu: 92, general: 80, emergency: 95 },
  { day: 'Sat', icu: 78, general: 65, emergency: 75 },
  { day: 'Sun', icu: 75, general: 60, emergency: 70 },
];

const bloodUsage = [
  { name: 'A+', value: 28, color: '#ef4444' },
  { name: 'A-', value: 6, color: '#f97316' },
  { name: 'B+', value: 24, color: '#eab308' },
  { name: 'B-', value: 5, color: '#22c55e' },
  { name: 'AB+', value: 11, color: '#06b6d4' },
  { name: 'AB-', value: 3, color: '#3b82f6' },
  { name: 'O+', value: 22, color: '#8b5cf6' },
  { name: 'O-', value: 1, color: '#ec4899' },
];

const regionData = [
  { region: 'North', hospitals: 42, emergencies: 156, satisfaction: 94 },
  { region: 'South', hospitals: 38, emergencies: 142, satisfaction: 92 },
  { region: 'East', hospitals: 28, emergencies: 98, satisfaction: 88 },
  { region: 'West', hospitals: 35, emergencies: 128, satisfaction: 91 },
  { region: 'Central', hospitals: 13, emergencies: 45, satisfaction: 89 },
];

const hourlyActivity = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  requests: Math.floor(Math.random() * 30) + 5,
  responses: Math.floor(Math.random() * 28) + 3,
}));

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    api.hospitals.getStats()
      .then(res => setLiveStats(res))
      .catch(err => console.warn('Failed to load analytics stats:', err));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into the SwasthyaSetu emergency network
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Emergencies</p>
                <p className="text-3xl font-bold">2,001</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>12% vs last period</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">9.8 min</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
                  <TrendingDown className="h-4 w-4" />
                  <span>18% faster</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-3xl font-bold">96.8%</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>2.3% improvement</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-3xl font-bold">8,420</p>
                <div className="flex items-center gap-1 mt-1 text-sm text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>24% growth</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emergency Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Request Trends</CardTitle>
            <CardDescription>Monthly requests and resolution rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={emergencyTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  name="Requests"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="2"
                  stroke="hsl(142 76% 36%)"
                  fill="hsl(142 76% 36%)"
                  fillOpacity={0.2}
                  name="Resolved"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Blood Usage Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Blood Usage Distribution</CardTitle>
            <CardDescription>Units used by blood type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bloodUsage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {bloodUsage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bed Occupancy */}
        <Card>
          <CardHeader>
            <CardTitle>Bed Occupancy Rates</CardTitle>
            <CardDescription>Weekly occupancy by bed type (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bedOccupancy}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="icu" name="ICU" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="general" name="General" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emergency" name="Emergency" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity Pattern</CardTitle>
            <CardDescription>Request volume throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" interval={3} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Requests"
                />
                <Line
                  type="monotone"
                  dataKey="responses"
                  stroke="hsl(142 76% 36%)"
                  strokeWidth={2}
                  dot={false}
                  name="Responses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Regional Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Performance</CardTitle>
          <CardDescription>Network statistics by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {regionData.map((region) => (
              <div
                key={region.region}
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-lg">{region.region}</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      Hospitals
                    </span>
                    <span className="font-medium">{region.hospitals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Emergencies
                    </span>
                    <span className="font-medium">{region.emergencies}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Satisfaction
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        region.satisfaction >= 90
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      )}
                    >
                      {region.satisfaction}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
