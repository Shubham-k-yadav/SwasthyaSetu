
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,

  CheckCircle,
  XCircle,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,



} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';






















const facilityOptions = [
  'Emergency',
  'ICU',
  'Trauma Center',
  'Blood Bank',
  'Cardiac Care',
  'Neurology',
  'Pediatrics',
  'Oncology',
  'Maternity',
  'Dialysis',
];

export default function HospitalsAdminPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const fetchHospitals = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.hospitals.getAll({ includeUnverified: true, limit: 100 });
      // Normalize API response — support both {hospitals:[]} and {data:[]}
      const list = data?.hospitals || data?.data || data || [];
      // Map backend fields to UI-expected shape
      const normalized = list.map((h) => ({
        ...h,
        id: h._id || h.id,
        totalBeds: (h.beds?.general?.total || 0) + (h.beds?.icu?.total || 0) + (h.beds?.ventilator?.total || 0),
        availableBeds: (h.beds?.general?.available || 0) + (h.beds?.icu?.available || 0) + (h.beds?.ventilator?.available || 0),
        icuBeds: h.beds?.icu?.total || 0,
        icuAvailable: h.beds?.icu?.available || 0,
        verified: h.isVerified ?? false,
        lastUpdated: h.lastUpdated ? new Date(h.lastUpdated) : new Date(),
        facilities: h.specialties || [],
      }));
      setHospitals(normalized);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
      setFetchError('Could not load hospitals. Showing cached data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const filteredHospitals = hospitals.filter((hospital) => {
    // Non-superadmin hospital admins can ONLY see and manage their assigned hospital
    if (!isSuperAdmin) {
      if (user?.hospitalId) {
        const userHospId = user.hospitalId._id || user.hospitalId;
        if (hospital.id !== userHospId && hospital._id !== userHospId) {
          return false;
        }
      } else {
        const firstKeyword = (user?.name || '').split(' ')[0].toLowerCase();
        if (firstKeyword && !hospital.name.toLowerCase().includes(firstKeyword)) {
          return false;
        }
      }
    }
    const matchesSearch =
      hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hospital.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || hospital.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const formatTime = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getOccupancyColor = (available, total) => {
    const rate = (total - available) / total;
    if (rate >= 0.9) return 'text-red-600 bg-red-50';
    if (rate >= 0.7) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hospital Management</h1>
          <p className="text-muted-foreground">
            Manage hospital registrations, bed availability, and verifications
            {hospitals.length > 0 && (
              <span className="ml-2 text-xs text-emerald-600 font-medium">
                ({hospitals.length} hospitals loaded from database)
              </span>
            )}
          </p>
        </div>
        {isSuperAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Hospital
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Hospital</DialogTitle>
              <DialogDescription>
                Register a new hospital in the SwasthyaSetu network
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Hospital Name</Label>
                  <Input id="name" placeholder="Enter hospital name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="charitable">Charitable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" placeholder="Full address" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" placeholder="State" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91-XX-XXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="contact@hospital.com" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalBeds">Total Beds</Label>
                  <Input id="totalBeds" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icuBeds">ICU Beds</Label>
                  <Input id="icuBeds" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Facilities</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {facilityOptions.map((facility) => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox id={facility} />
                      <Label htmlFor={facility} className="text-sm font-normal">
                        {facility}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Add Hospital</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading hospitals from database...</span>
        </div>
      )}

      {/* Error Banner */}
      {fetchError && !isLoading && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <span>⚠️ {fetchError}</span>
          <Button size="sm" variant="outline" onClick={fetchHospitals}>Retry</Button>
        </div>
      )}

      {/* Pending Approval Queue Card */}
      {!isLoading && isSuperAdmin && hospitals.some(h => !h.verified && !h.isVerified) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-600 animate-pulse" />
                <h2 className="text-lg font-bold text-amber-900 dark:text-amber-300">
                  Unverified Hospital Approval Queue
                </h2>
                <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40">
                  {hospitals.filter(h => !h.verified && !h.isVerified).length} Pending Review
                </Badge>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {hospitals.filter(h => !h.verified && !h.isVerified).map((hospital) => (
                <div key={hospital.id || hospital._id} className="p-4 rounded-lg border bg-card flex flex-col justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-base">{hospital.name}</h3>
                      <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Pending Certificate
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{hospital.address}, {hospital.city}</p>
                    <div className="mt-2 text-xs bg-muted p-2 rounded-md font-mono text-muted-foreground">
                      📄 Document: {hospital.registrationCertificate || 'REG-CERT-2026-PENDING.pdf'}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        setHospitals(prev => prev.filter(h => (h.id || h._id) !== (hospital.id || hospital._id)));
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => {
                        setHospitals(prev => prev.map(h => {
                          if ((h.id || h._id) === (hospital.id || hospital._id)) {
                            return { ...h, verified: true, isVerified: true, verificationStatus: 'approved' };
                          }
                          return h;
                        }));
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve & Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hospitals.length}</p>
                <p className="text-sm text-muted-foreground">Total Hospitals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {hospitals.filter((h) => h.verified).length}
                </p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {hospitals.filter((h) => h.blockchainVerified).length}
                </p>
                <p className="text-sm text-muted-foreground">Blockchain Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <XCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {hospitals.filter((h) => h.availableBeds === 0).length}
                </p>
                <p className="text-sm text-muted-foreground">At Full Capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="charitable">Charitable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div className="divide-y">
              {filteredHospitals.map((hospital) => (
                <div key={hospital.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          hospital.type === 'government'
                            ? 'bg-blue-100'
                            : hospital.type === 'private'
                              ? 'bg-purple-100'
                              : 'bg-amber-100'
                        )}
                      >
                        <Building2
                          className={cn(
                            'h-4 w-4',
                            hospital.type === 'government'
                              ? 'text-blue-600'
                              : hospital.type === 'private'
                                ? 'text-purple-600'
                                : 'text-amber-600'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{hospital.name}</p>
                        <Badge variant="secondary" className="mt-1 capitalize text-xs">
                          {hospital.type}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {hospital.city}, {hospital.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact</p>
                      <p>{hospital.phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">General Beds</p>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                          getOccupancyColor(hospital.availableBeds, hospital.totalBeds)
                        )}
                      >
                        {hospital.availableBeds}/{hospital.totalBeds}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">ICU Beds</p>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                          getOccupancyColor(hospital.icuAvailable, hospital.icuBeds)
                        )}
                      >
                        {hospital.icuAvailable}/{hospital.icuBeds}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <div className="flex flex-col gap-1">
                        {hospital.verified && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                            Verified
                          </Badge>
                        )}
                        {hospital.blockchainVerified && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Chain
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last updated {formatTime(hospital.lastUpdated)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Beds</TableHead>
                  <TableHead>ICU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHospitals.map((hospital) => (
                  <TableRow key={hospital.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            hospital.type === 'government'
                              ? 'bg-blue-100'
                              : hospital.type === 'private'
                                ? 'bg-purple-100'
                                : 'bg-amber-100'
                          )}
                        >
                          <Building2
                            className={cn(
                              'h-4 w-4',
                              hospital.type === 'government'
                                ? 'text-blue-600'
                                : hospital.type === 'private'
                                ? 'text-purple-600'
                                : 'text-amber-600'
                            )}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{hospital.name}</p>
                          <Badge variant="secondary" className="mt-1 capitalize text-xs">
                            {hospital.type}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {hospital.city}, {hospital.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                          getOccupancyColor(hospital.availableBeds, hospital.totalBeds)
                        )}
                      >
                        {hospital.availableBeds}/{hospital.totalBeds}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                          getOccupancyColor(hospital.icuAvailable, hospital.icuBeds)
                        )}
                      >
                        {hospital.icuAvailable}/{hospital.icuBeds}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hospital.verified && (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            Verified
                          </Badge>
                        )}
                        {hospital.blockchainVerified && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            <Shield className="h-3 w-3 mr-1" />
                            Chain
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTime(hospital.lastUpdated)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
