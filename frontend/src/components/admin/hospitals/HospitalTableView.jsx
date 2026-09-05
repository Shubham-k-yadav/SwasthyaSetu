import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Building2,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Shield,
  Bed
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HospitalTableView({
  filteredHospitals,
  isSuperAdmin,
  onOpenEditBeds,
  onDeleteHospital
}) {
  const formatTime = (date) => {
    if (!date) return 'Recently';
    const d = date instanceof Date ? date : new Date(date);
    const minutes = Math.floor((Date.now() - d.getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getOccupancyColor = (available, total) => {
    if (!total || total === 0) return 'text-emerald-600 bg-emerald-50';
    const rate = (total - available) / total;
    if (rate >= 0.9) return 'text-red-600 bg-red-50';
    if (rate >= 0.7) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  return (
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
                      {!isSuperAdmin && (
                        <DropdownMenuItem onClick={() => onOpenEditBeds(hospital)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Update Bed Stock
                        </DropdownMenuItem>
                      )}
                      {isSuperAdmin && onDeleteHospital && (
                        <DropdownMenuItem className="text-destructive" onClick={() => onDeleteHospital(hospital)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Hospital
                        </DropdownMenuItem>
                      )}
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
                    <div className="flex items-center gap-2">
                      {!isSuperAdmin && (
                        <Button size="sm" onClick={() => onOpenEditBeds(hospital)} className="gap-1.5 bg-primary hover:bg-primary/90 text-xs">
                          <Bed className="h-3.5 w-3.5" />
                          Update Beds
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!isSuperAdmin && (
                            <DropdownMenuItem onClick={() => onOpenEditBeds(hospital)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Update Bed Stock
                            </DropdownMenuItem>
                          )}
                          {isSuperAdmin && onDeleteHospital && (
                            <DropdownMenuItem className="text-destructive" onClick={() => onDeleteHospital(hospital)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Hospital
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default HospitalTableView;
