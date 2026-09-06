import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

import {
  HospitalStatsCards,
  HospitalFiltersBar,
  HospitalApprovalQueue,
  BedUpgradeApprovalQueue,
  HospitalTableView,
  EditBedsModal,
  AddHospitalModal
} from '@/components/admin/hospitals';


const INDIAN_STATES_AND_UTS = [
  'Andaman & Nicobar', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra & Nagar Haveli', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand',
  'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function HospitalsAdminPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [upgradeRequests, setUpgradeRequests] = useState([]);

  const fetchUpgradeRequests = async () => {
    if (!isSuperAdmin) return;
    try {
      const token = localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token');
      const data = await api.hospitals.getBedUpgradeQueue(token);
      setUpgradeRequests(data?.requests || []);
    } catch (err) {
      console.error('Failed to load bed upgrade queue:', err);
    }
  };

  const handleApproveBedUpgrade = async (req) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token');
      await api.hospitals.reviewBedUpgrade(req._id, 'approve', '', token);
      toast.success(`Approved capacity upgrade for ${req.hospitalName}!`);
      fetchUpgradeRequests();
      fetchHospitals();
    } catch (err) {
      toast.error('Failed to approve upgrade: ' + (err.message || 'Server error'));
    }
  };

  const handleRejectBedUpgrade = async (req, rejectionReason) => {
    try {
      const token = localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token');
      await api.hospitals.reviewBedUpgrade(req._id, 'reject', rejectionReason, token);
      toast.info(`Rejected capacity upgrade for ${req.hospitalName}`);
      fetchUpgradeRequests();
    } catch (err) {
      toast.error('Failed to reject upgrade: ' + (err.message || 'Server error'));
    }
  };

  // Edit Beds Modal State

  const [isEditBedsOpen, setIsEditBedsOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [bedFormData, setBedFormData] = useState({
    generalTotal: 175,
    generalAvail: 55,
    icuTotal: 37,
    icuAvail: 8,
    ventTotal: 12,
    ventAvail: 2,
  });

  const handleOpenEditBeds = (hospital) => {
    setEditingHospital(hospital);
    setBedFormData({
      generalTotal: hospital.beds?.general?.total ?? 175,
      generalAvail: hospital.beds?.general?.available ?? 55,
      icuTotal: hospital.beds?.icu?.total ?? 37,
      icuAvail: hospital.beds?.icu?.available ?? 8,
      ventTotal: hospital.beds?.ventilator?.total ?? 12,
      ventAvail: hospital.beds?.ventilator?.available ?? 2,
    });
    setIsEditBedsOpen(true);
  };

  const handleSaveBeds = async () => {
    if (!editingHospital) return;
    try {
      const token = localStorage.getItem('swasthya_setu_token') || localStorage.getItem('token');
      const payload = {
        general: { total: Number(bedFormData.generalTotal), available: Number(bedFormData.generalAvail) },
        icu: { total: Number(bedFormData.icuTotal), available: Number(bedFormData.icuAvail) },
        ventilator: { total: Number(bedFormData.ventTotal), available: Number(bedFormData.ventAvail) },
      };
      await api.hospitals.updateBeds(editingHospital.id || editingHospital._id, payload, token);
      toast.success(`Bed availability updated for ${editingHospital.name}!`);
      setIsEditBedsOpen(false);
      fetchHospitals();
    } catch (err) {
      console.error('Update beds error:', err);
      toast.error('Failed to update bed stock: ' + (err.message || 'Server error'));
    }
  };

  const fetchHospitals = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await api.hospitals.getAll({ includeUnverified: true, limit: 500 });
      const list = data?.hospitals || data?.data || data || [];
      const normalized = list.map((h) => {
        let typeVal = h.type || h.hospitalType || h.category;
        if (!typeVal) {
          const lowerName = (h.name || '').toLowerCase();
          if (lowerName.includes('govt') || lowerName.includes('government') || lowerName.includes('district') || lowerName.includes('aiims') || lowerName.includes('civil')) {
            typeVal = 'government';
          } else if (lowerName.includes('trust') || lowerName.includes('mission') || lowerName.includes('charitable')) {
            typeVal = 'charitable';
          } else {
            typeVal = 'private';
          }
        }

        return {
          ...h,
          id: h._id || h.id,
          type: typeVal.toLowerCase(),
          totalBeds: (h.beds?.general?.total || 0) + (h.beds?.icu?.total || 0) + (h.beds?.ventilator?.total || 0),
          availableBeds: (h.beds?.general?.available || 0) + (h.beds?.icu?.available || 0) + (h.beds?.ventilator?.available || 0),
          icuBeds: h.beds?.icu?.total || 0,
          icuAvailable: h.beds?.icu?.available || 0,
          verified: h.isVerified ?? false,
          lastUpdated: h.lastUpdated ? new Date(h.lastUpdated) : new Date(),
          facilities: h.specialties || [],
        };
      });
      setHospitals(normalized);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
      setFetchError('Could not load hospitals. Showing cached data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
    if (isSuperAdmin) {
      fetchUpgradeRequests();
    }
  }, [isSuperAdmin]);


  const availableStates = Array.from(
    new Set([
      ...INDIAN_STATES_AND_UTS,
      ...hospitals.map((h) => h.state).filter(Boolean)
    ])
  ).sort();

  const filteredHospitals = hospitals.filter((hospital) => {
    if (!isSuperAdmin) {
      const userHospId = user?.hospitalId ? String(user.hospitalId._id || user.hospitalId) : null;
      const currentHospId = String(hospital.id || hospital._id);

      if (userHospId) {
        if (currentHospId !== userHospId) return false;
      } else {
        const keywords = (user?.name || '')
          .toLowerCase()
          .replace('admin', '')
          .trim()
          .split(/\s+/)
          .filter(Boolean);

        const matchesAllKeywords = keywords.every((kw) => (hospital.name || '').toLowerCase().includes(kw));
        if (!matchesAllKeywords) return false;
      }
    }

    const matchesSearch =
      !searchQuery.trim() ||
      (hospital.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hospital.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hospital.state || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      typeFilter === 'all' ||
      !typeFilter ||
      (hospital.type && (
        hospital.type.toLowerCase() === typeFilter.toLowerCase() ||
        hospital.type.toLowerCase().includes(typeFilter.toLowerCase()) ||
        (typeFilter === 'government' && (hospital.type.toLowerCase().includes('govt') || hospital.type.toLowerCase().includes('district') || hospital.type.toLowerCase().includes('civil') || hospital.type.toLowerCase().includes('aiims'))) ||
        (typeFilter === 'charitable' && (hospital.type.toLowerCase().includes('trust') || hospital.type.toLowerCase().includes('mission')))
      ));

    const isVerified = hospital.verified || hospital.isVerified;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && isVerified) ||
      (statusFilter === 'pending' && !isVerified);

    const matchesState = (() => {
      if (stateFilter === 'all' || !stateFilter) return true;
      const targetState = stateFilter.toLowerCase();
      const hospState = (hospital.state || '').toLowerCase();
      const hospCity = (hospital.city || '').toLowerCase();
      const hospAddress = (hospital.address || '').toLowerCase();

      if (hospState.includes(targetState) || targetState.includes(hospState)) return true;

      if (targetState.includes('uttar pradesh') || targetState === 'up') {
        const upKeywords = ['up', 'u.p.', 'uttar pradesh', 'prayagraj', 'allahabad', 'lucknow', 'kanpur', 'varanasi', 'noida', 'ghaziabad', 'agra', 'gorakhpur', 'bareilly', 'aligarh', 'meerut', 'jhansi', 'mathura', 'ayodhya', 'faizabad', 'mirzapur', 'ballia', 'jaunpur', 'sultanpur', 'azamgarh'];
        return upKeywords.some(k => hospState.includes(k) || hospCity.includes(k) || hospAddress.includes(k));
      }
      if (targetState.includes('madhya pradesh') || targetState === 'mp') {
        const mpKeywords = ['mp', 'm.p.', 'madhya pradesh', 'bhopal', 'indore', 'gwalior', 'jabalpur', 'rewai', 'ujjain'];
        return mpKeywords.some(k => hospState.includes(k) || hospCity.includes(k) || hospAddress.includes(k));
      }
      if (targetState.includes('chhattisgarh') || targetState === 'cg') {
        const cgKeywords = ['cg', 'c.g.', 'chhattisgarh', 'raipur', 'bilaspur', 'durg', 'bhilai', 'korba'];
        return cgKeywords.some(k => hospState.includes(k) || hospCity.includes(k) || hospAddress.includes(k));
      }
      if (targetState.includes('maharashtra') || targetState === 'mh') {
        const mhKeywords = ['mh', 'maharashtra', 'mumbai', 'pune', 'nagpur', 'thane', 'nashik'];
        return mhKeywords.some(k => hospState.includes(k) || hospCity.includes(k) || hospAddress.includes(k));
      }

      return false;
    })();

    return matchesSearch && matchesType && matchesStatus && matchesState;
  });

  const handleApproveHospital = (hospital) => {
    setHospitals(prev => prev.map(h => {
      if ((h.id || h._id) === (hospital.id || hospital._id)) {
        return { ...h, verified: true, isVerified: true, verificationStatus: 'approved' };
      }
      return h;
    }));
    toast.success(`Approved ${hospital.name}!`);
  };

  const handleRejectHospital = (hospital) => {
    setHospitals(prev => prev.filter(h => (h.id || h._id) !== (hospital.id || hospital._id)));
    toast.info(`Rejected ${hospital.name}`);
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
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hospital
          </Button>
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
      {!isLoading && isSuperAdmin && (
        <HospitalApprovalQueue
          hospitals={hospitals}
          onApprove={handleApproveHospital}
          onReject={handleRejectHospital}
        />
      )}

      {/* Bed Capacity Upgrade Requests Queue */}
      {!isLoading && isSuperAdmin && (
        <BedUpgradeApprovalQueue
          upgradeRequests={upgradeRequests}
          onApprove={handleApproveBedUpgrade}
          onReject={handleRejectBedUpgrade}
        />
      )}


      {/* Stats Cards */}
      <HospitalStatsCards hospitals={hospitals} />

      {/* Filters Bar */}
      <HospitalFiltersBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        stateFilter={stateFilter}
        setStateFilter={setStateFilter}
        availableStates={availableStates}
      />

      {/* Table / List View */}
      <HospitalTableView
        filteredHospitals={filteredHospitals}
        isSuperAdmin={isSuperAdmin}
        onOpenEditBeds={handleOpenEditBeds}
      />

      {/* Edit Beds Dialog Modal */}
      <EditBedsModal
        open={isEditBedsOpen}
        onOpenChange={setIsEditBedsOpen}
        editingHospital={editingHospital}
        bedFormData={bedFormData}
        setBedFormData={setBedFormData}
        onSave={handleSaveBeds}
      />

      {/* Add Hospital Modal */}
      <AddHospitalModal
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}
