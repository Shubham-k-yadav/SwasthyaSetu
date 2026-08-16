
import { useState } from 'react';
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




















const mockHospitals = [
  {
    id: '1',
    name: 'AIIMS Delhi',
    type: 'government',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar',
    phone: '+91-11-26588500',
    email: 'contact@aiims.edu',
    totalBeds: 2500,
    availableBeds: 320,
    icuBeds: 200,
    icuAvailable: 15,
    verified: true,
    blockchainVerified: true,
    lastUpdated: new Date(Date.now() - 30 * 60000),
    facilities: ['Emergency', 'ICU', 'Trauma Center', 'Blood Bank'],
  },
  {
    id: '2',
    name: 'Apollo Hospital',
    type: 'private',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Plot 13, Off Parsik Hill Road, CBD Belapur',
    phone: '+91-22-33503350',
    email: 'info@apollohospitals.com',
    totalBeds: 450,
    availableBeds: 78,
    icuBeds: 50,
    icuAvailable: 8,
    verified: true,
    blockchainVerified: true,
    lastUpdated: new Date(Date.now() - 15 * 60000),
    facilities: ['Emergency', 'ICU', 'Cardiac Care', 'Blood Bank'],
  },
  {
    id: '3',
    name: 'Fortis Healthcare',
    type: 'private',
    city: 'Bangalore',
    state: 'Karnataka',
    address: '154/9, Bannerghatta Road',
    phone: '+91-80-66214444',
    email: 'enquiry@fortishealthcare.com',
    totalBeds: 380,
    availableBeds: 42,
    icuBeds: 40,
    icuAvailable: 3,
    verified: true,
    blockchainVerified: false,
    lastUpdated: new Date(Date.now() - 45 * 60000),
    facilities: ['Emergency', 'ICU', 'Neurology'],
  },
  {
    id: '4',
    name: 'Tata Memorial Hospital',
    type: 'charitable',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Dr. E Borges Road, Parel',
    phone: '+91-22-24177000',
    email: 'info@tmc.gov.in',
    totalBeds: 629,
    availableBeds: 0,
    icuBeds: 30,
    icuAvailable: 0,
    verified: true,
    blockchainVerified: true,
    lastUpdated: new Date(Date.now() - 60 * 60000),
    facilities: ['Oncology', 'ICU', 'Blood Bank'],
  },
  {
    id: '5',
    name: 'Christian Medical College',
    type: 'charitable',
    city: 'Vellore',
    state: 'Tamil Nadu',
    address: 'Ida Scudder Road',
    phone: '+91-416-2281000',
    email: 'enquiry@cmcvellore.ac.in',
    totalBeds: 2500,
    availableBeds: 180,
    icuBeds: 150,
    icuAvailable: 12,
    verified: true,
    blockchainVerified: true,
    lastUpdated: new Date(Date.now() - 20 * 60000),
    facilities: ['Emergency', 'ICU', 'Trauma Center', 'Blood Bank', 'Pediatrics'],
  },
];

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
  const [hospitals, setHospitals] = useState(mockHospitals);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const filteredHospitals = hospitals.filter((hospital) => {
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
          </p>
        </div>
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
      </div>

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
