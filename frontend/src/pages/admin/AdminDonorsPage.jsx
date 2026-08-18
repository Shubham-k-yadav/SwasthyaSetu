
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,

  MapPin,

  CheckCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Droplets,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, } from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
















const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];



export default function DonorsAdminPage() {
  const [donors, setDonors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const res = await api.donor.search({});
      const list = res?.donors || res || [];
      const normalized = list.map((d, i) => ({
        id: d._id || d.id || String(i + 1),
        name: d.name || 'Anonymous Donor',
        email: d.email || `${d.name?.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: d.phone || '+91 99999 99999',
        bloodType: d.bloodGroup || d.bloodType || 'O+',
        city: d.city || 'N/A',
        state: d.state || 'N/A',
        lastDonation: d.lastDonation ? new Date(d.lastDonation) : null,
        totalDonations: d.totalDonations ?? 1,
        status: d.isAvailable ? 'active' : 'inactive',
        registeredAt: d.createdAt ? new Date(d.createdAt) : new Date(),
        verified: true,
      }));
      setDonors(normalized);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const filteredDonors = donors.filter((donor) => {
    const matchesSearch =
      donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      donor.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBloodType = bloodTypeFilter === 'all' || donor.bloodType === bloodTypeFilter;
    const matchesStatus = statusFilter === 'all' || donor.status === statusFilter;
    return matchesSearch && matchesBloodType && matchesStatus;
  });

  const activeDonors = donors.filter((d) => d.status === 'active').length;
  const pendingVerification = donors.filter((d) => !d.verified).length;
  const totalDonations = donors.reduce((sum, d) => sum + d.totalDonations, 0);

  const formatDate = (date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const canDonate = (lastDonation) => {
    if (!lastDonation) return true;
    const daysSince = Math.floor((Date.now() - lastDonation.getTime()) / (24 * 60 * 60 * 1000));
    return daysSince >= 90;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Donor Management</h1>
          <p className="text-muted-foreground">
            Manage registered blood donors across the network
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Donor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Donor</DialogTitle>
              <DialogDescription>
                Add a new blood donor to the SwasthyaSetu network
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 XXXXX XXXXX" />
                </div>
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsAddDialogOpen(false)}>Register Donor</Button>
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
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{donors.length}</p>
                <p className="text-sm text-muted-foreground">Total Donors</p>
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
                <p className="text-2xl font-bold">{activeDonors}</p>
                <p className="text-sm text-muted-foreground">Active Donors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingVerification}</p>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <Droplets className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalDonations}</p>
                <p className="text-sm text-muted-foreground">Total Donations</p>
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
                placeholder="Search donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={bloodTypeFilter} onValueChange={setBloodTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Droplets className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Blood Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {bloodTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Donor</TableHead>
                  <TableHead>Blood Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {donor.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{donor.name}</p>
                          <p className="text-xs text-muted-foreground">{donor.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-bold text-primary border-primary">
                        {donor.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {donor.city}, {donor.state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(donor.lastDonation)}</p>
                        {donor.lastDonation && (
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs mt-1',
                              canDonate(donor.lastDonation)
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            )}
                          >
                            {canDonate(donor.lastDonation) ? 'Eligible' : 'Not yet eligible'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{donor.totalDonations}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            'capitalize',
                            donor.status === 'active' && 'bg-emerald-100 text-emerald-700',
                            donor.status === 'inactive' && 'bg-gray-100 text-gray-700',
                            donor.status === 'pending' && 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {donor.status}
                        </Badge>
                        {donor.verified && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                      </div>
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
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Contact
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredDonors.map((donor) => (
              <Card key={donor.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {donor.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{donor.name}</p>
                        <p className="text-xs text-muted-foreground">{donor.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'capitalize',
                          donor.status === 'active' && 'bg-emerald-100 text-emerald-700',
                          donor.status === 'inactive' && 'bg-gray-100 text-gray-700',
                          donor.status === 'pending' && 'bg-amber-100 text-amber-700'
                        )}
                      >
                        {donor.status}
                      </Badge>
                      {donor.verified && (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Blood Type</span>
                      <div className="mt-1">
                        <Badge variant="outline" className="font-bold text-primary border-primary">
                          {donor.bloodType}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Total Donations</span>
                      <p className="text-lg font-semibold mt-1">{donor.totalDonations}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{donor.city}, {donor.state}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Last Donation: </span>
                      <span className="text-sm">{formatDate(donor.lastDonation)}</span>
                      {donor.lastDonation && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs ml-2',
                            canDonate(donor.lastDonation)
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          {canDonate(donor.lastDonation) ? 'Eligible' : 'Not yet eligible'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
