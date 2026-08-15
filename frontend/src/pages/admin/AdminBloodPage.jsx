
import { useState } from 'react';
import {
  Droplets,
  Plus,
  Search,
  Filter,
  AlertTriangle,

  TrendingDown,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';














const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const mockBloodStock = [
  {
    id: '1',
    hospitalId: 'h1',
    hospitalName: 'AIIMS Delhi',
    city: 'New Delhi',
    bloodType: 'O-',
    units: 12,
    minThreshold: 50,
    maxCapacity: 200,
    lastUpdated: new Date(Date.now() - 30 * 60000),
    expiringIn7Days: 5,
  },
  {
    id: '2',
    hospitalId: 'h1',
    hospitalName: 'AIIMS Delhi',
    city: 'New Delhi',
    bloodType: 'A+',
    units: 145,
    minThreshold: 50,
    maxCapacity: 200,
    lastUpdated: new Date(Date.now() - 30 * 60000),
    expiringIn7Days: 12,
  },
  {
    id: '3',
    hospitalId: 'h2',
    hospitalName: 'Apollo Hospital',
    city: 'Mumbai',
    bloodType: 'B+',
    units: 78,
    minThreshold: 30,
    maxCapacity: 150,
    lastUpdated: new Date(Date.now() - 45 * 60000),
    expiringIn7Days: 8,
  },
  {
    id: '4',
    hospitalId: 'h2',
    hospitalName: 'Apollo Hospital',
    city: 'Mumbai',
    bloodType: 'AB-',
    units: 8,
    minThreshold: 20,
    maxCapacity: 100,
    lastUpdated: new Date(Date.now() - 45 * 60000),
    expiringIn7Days: 3,
  },
  {
    id: '5',
    hospitalId: 'h3',
    hospitalName: 'Fortis Healthcare',
    city: 'Bangalore',
    bloodType: 'O+',
    units: 92,
    minThreshold: 40,
    maxCapacity: 180,
    lastUpdated: new Date(Date.now() - 60 * 60000),
    expiringIn7Days: 15,
  },
];

const bloodTypeStats = bloodTypes.map((type) => {
  const stocks = mockBloodStock.filter((s) => s.bloodType === type);
  const totalUnits = stocks.reduce((sum, s) => sum + s.units, 0);
  const totalCapacity = stocks.reduce((sum, s) => sum + s.maxCapacity, 0);
  const criticalCount = stocks.filter((s) => s.units < s.minThreshold).length;
  return {
    type,
    totalUnits,
    totalCapacity,
    criticalCount,
    percentage: totalCapacity > 0 ? (totalUnits / totalCapacity) * 100 : 0,
  };
});

export default function BloodAdminPage() {
  const [stocks, setStocks] = useState(mockBloodStock);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      stock.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || stock.bloodType === typeFilter;
    return matchesSearch && matchesType;
  });

  const criticalStocks = stocks.filter((s) => s.units < s.minThreshold);
  const totalUnits = stocks.reduce((sum, s) => sum + s.units, 0);
  const expiringUnits = stocks.reduce((sum, s) => sum + s.expiringIn7Days, 0);

  const formatTime = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStockLevel = (units, min, max) => {
    const percentage = (units / max) * 100;
    if (units < min) return { label: 'Critical', color: 'text-red-600 bg-red-50', variant: 'destructive'  };
    if (percentage < 40) return { label: 'Low', color: 'text-amber-600 bg-amber-50', variant: 'secondary'  };
    if (percentage < 70) return { label: 'Normal', color: 'text-emerald-600 bg-emerald-50', variant: 'secondary'  };
    return { label: 'High', color: 'text-blue-600 bg-blue-50', variant: 'secondary'  };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blood Stock Management</h1>
          <p className="text-muted-foreground">
            Monitor and update blood inventory across all hospitals
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Update Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Blood Stock</DialogTitle>
                <DialogDescription>
                  Update blood inventory for a hospital
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Hospital</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select hospital" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h1">AIIMS Delhi</SelectItem>
                      <SelectItem value="h2">Apollo Hospital, Mumbai</SelectItem>
                      <SelectItem value="h3">Fortis Healthcare, Bangalore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Blood Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Units Available</Label>
                  <Input type="number" placeholder="Enter units" />
                </div>
                <div className="space-y-2">
                  <Label>Units Expiring in 7 Days</Label>
                  <Input type="number" placeholder="0" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsUpdateDialogOpen(false)}>Update Stock</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Droplets className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUnits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalStocks.length}</p>
                <p className="text-sm text-muted-foreground">Critical Low</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringUnits}</p>
                <p className="text-sm text-muted-foreground">Expiring in 7 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(stocks.map((s) => s.hospitalId)).size}
                </p>
                <p className="text-sm text-muted-foreground">Blood Banks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blood Type Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Blood Type Overview</CardTitle>
          <CardDescription>Current inventory levels by blood type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bloodTypeStats.map((stat) => (
              <div
                key={stat.type}
                className={cn(
                  'p-4 rounded-lg border',
                  stat.criticalCount > 0 ? 'border-red-200 bg-red-50' : 'bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold">{stat.type}</span>
                  {stat.criticalCount > 0 && (
                    <Badge variant="destructive">{stat.criticalCount} Critical</Badge>
                  )}
                </div>
                <p className="text-lg font-semibold">{stat.totalUnits} units</p>
                <Progress value={stat.percentage} className="h-2 mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.percentage.toFixed(0)}% of capacity
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blood Types</SelectItem>
                {bloodTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Blood Type</TableHead>
                <TableHead>Available Units</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Expiring Soon</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.map((stock) => {
                const level = getStockLevel(stock.units, stock.minThreshold, stock.maxCapacity);
                return (
                  <TableRow key={stock.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{stock.hospitalName}</p>
                        <p className="text-sm text-muted-foreground">{stock.city}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold">
                        {stock.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{stock.units}</span>
                        <span className="text-muted-foreground">/ {stock.maxCapacity}</span>
                      </div>
                      <Progress
                        value={(stock.units / stock.maxCapacity) * 100}
                        className="h-1.5 mt-1 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={level.variant} className={level.color}>
                        {level.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stock.expiringIn7Days > 0 ? (
                        <span className="text-amber-600 font-medium">
                          {stock.expiringIn7Days} units
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(stock.lastUpdated)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
