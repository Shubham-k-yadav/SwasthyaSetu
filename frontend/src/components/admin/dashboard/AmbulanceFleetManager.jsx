import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Siren, Plus, RefreshCw, Radio, Copy, ExternalLink } from 'lucide-react';
import { HospitalMap } from '@/components/maps/hospital-map';
import { cn } from '@/lib/utils';

export function AmbulanceFleetManager({
  hospital,
  hospitalName,
  ambulances,
  showAddForm,
  setShowAddForm,
  ambForm,
  setAmbForm,
  addingAmbulance,
  onAddAmbulance,
  onStatusChange,
  onCopyDriverLink
}) {
  return (
    <Card className="border-amber-500/30 bg-card shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Siren className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-lg font-bold">Hospital Ambulance Fleet Control</CardTitle>
            <Badge className="bg-amber-600 text-white text-xs">{ambulances.length} Vehicles</Badge>
          </div>
          <CardDescription className="text-xs mt-0.5">
            Register and manage your hospital's ambulance fleet. Share location links with drivers to broadcast live GPS location.
          </CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 text-xs font-semibold shrink-0"
        >
          <Plus className="h-4 w-4" />
          {showAddForm ? 'Cancel Add' : 'Register New Ambulance'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Add Ambulance Form */}
        {showAddForm && (
          <form onSubmit={onAddAmbulance} className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              🚑 Add New Ambulance to {hospitalName}
            </h4>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Vehicle Reg Number *</label>
                <Input
                  required
                  placeholder="e.g. DL-01-AMB-108"
                  value={ambForm.vehicleNumber}
                  onChange={(e) => setAmbForm({ ...ambForm, vehicleNumber: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Driver Name *</label>
                <Input
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={ambForm.driverName}
                  onChange={(e) => setAmbForm({ ...ambForm, driverName: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Driver Phone Number *</label>
                <Input
                  required
                  placeholder="e.g. +91-9876543210"
                  value={ambForm.driverPhone}
                  onChange={(e) => setAmbForm({ ...ambForm, driverPhone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Equipment Level</label>
                <Select
                  value={ambForm.equipmentLevel}
                  onValueChange={(val) => setAmbForm({ ...ambForm, equipmentLevel: val })}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALS Ambulance (Advanced Life Support)">ALS (Advanced Life Support)</SelectItem>
                    <SelectItem value="BLS Ambulance (Basic Life Support)">BLS (Basic Life Support)</SelectItem>
                    <SelectItem value="ICU Mobile Unit">ICU Mobile Unit</SelectItem>
                    <SelectItem value="Patient Transport">Patient Transport</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={addingAmbulance} className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5">
                {addingAmbulance ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Register & Generate Driver Link
              </Button>
            </div>
          </form>
        )}

        {/* Live Fleet Tracking Map */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
              <Radio className="h-4 w-4 text-emerald-600 animate-pulse" />
              Live Fleet Tracking Radar & Uber-style Navigation Map
            </h4>
            <Badge className="bg-emerald-600 text-white text-[10px] font-bold">LIVE GPS STREAM</Badge>
          </div>
          <HospitalMap 
            hospitals={hospital ? [hospital] : []}
            selectedHospital={hospital}
            userLocation={hospital?.coordinates ? { lat: hospital.coordinates.lat, lng: hospital.coordinates.lng } : null}
            ambulances={ambulances}
          />
        </div>

        {/* Ambulances List */}
        {ambulances.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
            <Siren className="h-8 w-8 mx-auto text-amber-500/50" />
            <p className="font-semibold text-foreground">No Ambulances Registered Yet</p>
            <p className="text-[11px] max-w-sm mx-auto">
              Click <strong>"Register New Ambulance"</strong> above to add your hospital's emergency response vehicles and get live GPS driver tracking links.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ambulances.map((amb) => {
              const ambId = amb._id || amb.id;
              return (
                <div key={ambId} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">🚑 {amb.vehicleNumber}</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-bold',
                          amb.status === 'available'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : amb.status === 'busy'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                        )}
                      >
                        {(amb.status || 'available').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Driver: <strong>{amb.driverName}</strong> | 📞 {amb.driverPhone} | Type: {amb.equipmentLevel || 'ALS'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={amb.status || 'available'}
                      onValueChange={(newStatus) => onStatusChange(ambId, newStatus)}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs font-semibold">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">🟢 Available</SelectItem>
                        <SelectItem value="busy">🟡 On Emergency</SelectItem>
                        <SelectItem value="maintenance">🔴 Maintenance</SelectItem>
                        <SelectItem value="offline">⚪ Offline</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold gap-1"
                      onClick={() => onCopyDriverLink(amb.driverToken, ambId)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy Driver GPS Link
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-primary gap-1"
                      onClick={() => window.open(`/driver/${amb.driverToken || ambId}`, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Portal
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AmbulanceFleetManager;
