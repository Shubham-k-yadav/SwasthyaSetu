import { Card, CardContent } from '@/components/ui/card';
import { Building2, Shield, Bed, CheckCircle } from 'lucide-react';

export function HospitalStatsCards({ hospitals }) {
  const verifiedCount = hospitals.filter(h => h.verified || h.isVerified).length;
  const totalBedsCount = hospitals.reduce((acc, h) => acc + (h.totalBeds || 0), 0);
  const totalAvailableBeds = hospitals.reduce((acc, h) => acc + (h.availableBeds || 0), 0);

  return (
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
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{verifiedCount}</p>
              <p className="text-sm text-muted-foreground">Verified Hospitals</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Bed className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalBedsCount}</p>
              <p className="text-sm text-muted-foreground">Total Network Beds</p>
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
              <p className="text-2xl font-bold">{totalAvailableBeds}</p>
              <p className="text-sm text-muted-foreground">Available Beds</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HospitalStatsCards;
