 
import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,

  MapPin,
  User,
  Building2,
  Droplets,
  Activity,
  Eye,

} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';























const mockEmergencies = [
  {
    id: '1',
    patientName: 'Rahul Sharma',
    contactNumber: '+91 98765 43210',
    emergencyType: 'both',
    bloodType: 'O-',
    unitsNeeded: 4,
    bedType: 'icu',
    bedsNeeded: 1,
    location: {
      city: 'New Delhi',
      address: 'Connaught Place, Central Delhi',
      lat: 28.6315,
      lng: 77.2167,
    },
    status: 'pending',
    priority: 'critical',
    createdAt: new Date(Date.now() - 5 * 60000),
  },
  {
    id: '2',
    patientName: 'Priya Patel',
    contactNumber: '+91 87654 32109',
    emergencyType: 'blood',
    bloodType: 'AB+',
    unitsNeeded: 2,
    location: {
      city: 'Mumbai',
      address: 'Andheri West, Mumbai',
      lat: 19.1364,
      lng: 72.8296,
    },
    status: 'processing',
    priority: 'high',
    createdAt: new Date(Date.now() - 15 * 60000),
    assignedHospital: 'Apollo Hospital Mumbai',
  },
  {
    id: '3',
    patientName: 'Amit Kumar',
    contactNumber: '+91 76543 21098',
    emergencyType: 'bed',
    bedType: 'emergency',
    bedsNeeded: 2,
    location: {
      city: 'Bangalore',
      address: 'Koramangala, Bangalore',
      lat: 12.9352,
      lng: 77.6245,
    },
    status: 'processing',
    priority: 'medium',
    createdAt: new Date(Date.now() - 30 * 60000),
    assignedHospital: 'Fortis Healthcare',
  },
  {
    id: '4',
    patientName: 'Sunita Devi',
    contactNumber: '+91 65432 10987',
    emergencyType: 'blood',
    bloodType: 'B+',
    unitsNeeded: 3,
    location: {
      city: 'Chennai',
      address: 'T. Nagar, Chennai',
      lat: 13.0418,
      lng: 80.2341,
    },
    status: 'resolved',
    priority: 'high',
    createdAt: new Date(Date.now() - 60 * 60000),
    assignedHospital: 'Apollo Hospital Chennai',
    notes: 'Blood delivered successfully. Patient stable.',
  },
  {
    id: '5',
    patientName: 'Vikram Singh',
    contactNumber: '+91 54321 09876',
    emergencyType: 'both',
    bloodType: 'A+',
    unitsNeeded: 2,
    bedType: 'icu',
    bedsNeeded: 1,
    location: {
      city: 'Kolkata',
      address: 'Salt Lake, Kolkata',
      lat: 22.5726,
      lng: 88.3639,
    },
    status: 'cancelled',
    priority: 'medium',
    createdAt: new Date(Date.now() - 120 * 60000),
    notes: 'Patient transferred to private facility.',
  },
];

export default function EmergenciesAdminPage() {
  const [emergencies, setEmergencies] = useState(mockEmergencies);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const filteredEmergencies = emergencies.filter((e) => {
    if (statusFilter === 'all') return true;
    return e.status === statusFilter;
  });

  const pendingCount = emergencies.filter((e) => e.status === 'pending').length;
  const processingCount = emergencies.filter((e) => e.status === 'processing').length;
  const resolvedCount = emergencies.filter((e) => e.status === 'resolved').length;

  const formatTime = (date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-amber-100 text-amber-700 border-amber-200',
      medium: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return variants[priority ] || '';
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: 'bg-amber-100 text-amber-700', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-700', icon: Activity },
      resolved: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
      cancelled: { color: 'bg-gray-100 text-gray-700', icon: XCircle },
    };
    return variants[status ] || variants.pending;
  };

  const handleStatusChange = (id, newStatus) => {
    setEmergencies((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: newStatus  } : e))
    );
  };

  const viewDetails = (emergency) => {
    setSelectedEmergency(emergency);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Emergency Requests</h1>
          <p className="text-muted-foreground">
            Manage and respond to emergency bed and blood requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={cn('cursor-pointer transition-shadow hover:shadow-md', statusFilter === 'pending' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('pending')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-shadow hover:shadow-md', statusFilter === 'processing' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('processing')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{processingCount}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-shadow hover:shadow-md', statusFilter === 'resolved' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('resolved')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn('cursor-pointer transition-shadow hover:shadow-md', statusFilter === 'all' && 'ring-2 ring-primary')}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{emergencies.length}</p>
                <p className="text-sm text-muted-foreground">Total Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Requests</CardTitle>
              <CardDescription>
                {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} emergency requests
              </CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmergencies.map((emergency) => {
                  const statusInfo = getStatusBadge(emergency.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={emergency.id} className={cn(emergency.priority === 'critical' && emergency.status === 'pending' && 'bg-red-50/50')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{emergency.patientName}</p>
                            <p className="text-xs text-muted-foreground">{emergency.contactNumber}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {(emergency.emergencyType === 'bed' || emergency.emergencyType === 'both') && (
                            <Badge variant="outline" className="w-fit">
                              <Building2 className="h-3 w-3 mr-1" />
                              {emergency.bedsNeeded} {emergency.bedType?.toUpperCase()}
                            </Badge>
                          )}
                          {(emergency.emergencyType === 'blood' || emergency.emergencyType === 'both') && (
                            <Badge variant="outline" className="w-fit">
                              <Droplets className="h-3 w-3 mr-1" />
                              {emergency.unitsNeeded} units {emergency.bloodType}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {emergency.location.city}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('capitalize', getPriorityBadge(emergency.priority))}>
                          {emergency.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={cn('capitalize', statusInfo.color)}>
                            {emergency.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTime(emergency.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDetails(emergency)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {emergency.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={() => handleStatusChange(emergency.id, 'processing')}
                            >
                              Accept
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4 p-4">
            {filteredEmergencies.map((emergency) => {
              const statusInfo = getStatusBadge(emergency.status);
              const StatusIcon = statusInfo.icon;
              return (
                <Card key={emergency.id} className={cn('p-4', emergency.priority === 'critical' && emergency.status === 'pending' && 'border-red-200 bg-red-50/50')}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{emergency.patientName}</p>
                          <p className="text-xs text-muted-foreground">{emergency.contactNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('capitalize', getPriorityBadge(emergency.priority))}>
                          {emergency.priority}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={cn('capitalize', statusInfo.color)}>
                            {emergency.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{emergency.location.city}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Time: </span>
                        <span className="text-sm text-muted-foreground">{formatTime(emergency.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {(emergency.emergencyType === 'bed' || emergency.emergencyType === 'both') && (
                        <Badge variant="outline" className="w-fit">
                          <Building2 className="h-3 w-3 mr-1" />
                          {emergency.bedsNeeded} {emergency.bedType?.toUpperCase()} Bed{emergency.bedsNeeded !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {(emergency.emergencyType === 'blood' || emergency.emergencyType === 'both') && (
                        <Badge variant="outline" className="w-fit">
                          <Droplets className="h-3 w-3 mr-1" />
                          {emergency.unitsNeeded} units {emergency.bloodType}
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => viewDetails(emergency)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {emergency.status === 'pending' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleStatusChange(emergency.id, 'processing')}
                        >
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Emergency Request Details</DialogTitle>
            <DialogDescription>
              Request ID: {selectedEmergency?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedEmergency && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Patient Name</Label>
                  <p className="font-medium">{selectedEmergency.patientName}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Contact</Label>
                  <p className="font-medium">{selectedEmergency.contactNumber}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Location</Label>
                  <p className="font-medium">{selectedEmergency.location.address}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmergency.location.city}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Priority</Label>
                  <Badge className={cn('capitalize', getPriorityBadge(selectedEmergency.priority))}>
                    {selectedEmergency.priority}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Requirements</Label>
                <div className="flex gap-2 flex-wrap">
                  {(selectedEmergency.emergencyType === 'bed' || selectedEmergency.emergencyType === 'both') && (
                    <Badge variant="secondary" className="gap-1">
                      <Building2 className="h-3 w-3" />
                      {selectedEmergency.bedsNeeded} {selectedEmergency.bedType?.toUpperCase()} bed(s)
                    </Badge>
                  )}
                  {(selectedEmergency.emergencyType === 'blood' || selectedEmergency.emergencyType === 'both') && (
                    <Badge variant="secondary" className="gap-1">
                      <Droplets className="h-3 w-3" />
                      {selectedEmergency.unitsNeeded} units of {selectedEmergency.bloodType}
                    </Badge>
                  )}
                </div>
              </div>

              {selectedEmergency.assignedHospital && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Assigned Hospital</Label>
                  <p className="font-medium">{selectedEmergency.assignedHospital}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-muted-foreground">Update Status</Label>
                <Select
                  value={selectedEmergency.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedEmergency.id, value);
                    setSelectedEmergency({ ...selectedEmergency, status: value  });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Notes</Label>
                <Textarea
                  placeholder="Add notes about this emergency..."
                  defaultValue={selectedEmergency.notes}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
