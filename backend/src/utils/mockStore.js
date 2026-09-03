export const mockHospitals = [
  {
    _id: '66c000000000000000000001',
    id: '66c000000000000000000001',
    name: 'Apollo Hospital Bilaspur',
    city: 'Bilaspur',
    state: 'Chhattisgarh',
    address: 'Rajkishore Nagar, Bilaspur',
    phone: '07752-243300',
    emergencyContact: '07752-243301',
    isVerified: true,
    verificationStatus: 'verified',
    beds: {
      icu: { total: 25, available: 8 },
      general: { total: 100, available: 32 },
      ventilator: { total: 15, available: 4 }
    }
  },
  {
    _id: '66c000000000000000000002',
    id: '66c000000000000000000002',
    name: 'AIIMS New Delhi',
    city: 'Delhi',
    state: 'Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
    phone: '011-26588500',
    emergencyContact: '011-26588700',
    isVerified: true,
    verificationStatus: 'verified',
    beds: {
      icu: { total: 60, available: 12 },
      general: { total: 350, available: 45 },
      ventilator: { total: 40, available: 6 }
    }
  },
  {
    _id: '66c000000000000000000003',
    id: '66c000000000000000000003',
    name: 'KEM Hospital Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    phone: '022-24107000',
    emergencyContact: '022-24136051',
    isVerified: true,
    verificationStatus: 'verified',
    beds: {
      icu: { total: 40, available: 5 },
      general: { total: 200, available: 18 },
      ventilator: { total: 20, available: 3 }
    }
  }
];

export const mockDonors = [];
export const mockReservations = [];
export const mockBloodStock = [];
export const mockEmergencies = [];

export const mockUsers = [
  {
    _id: '66c000000000000000000090',
    id: '66c000000000000000000090',
    email: 'superadmin@swasthyasetu.in',
    password: 'SuperAdmin@2024',
    name: 'National Health Super Admin',
    role: 'superadmin'
  },
  {
    _id: '66c000000000000000000091',
    id: '66c000000000000000000091',
    email: 'admin@apollo.com',
    password: 'Apollo@2024',
    name: 'Apollo Bilaspur Admin',
    role: 'admin',
    hospitalId: '66c000000000000000000001'
  },
  {
    _id: '66c000000000000000000092',
    id: '66c000000000000000000092',
    email: 'admin@aiims.edu',
    password: 'AIIMS@2024',
    name: 'AIIMS Delhi Admin',
    role: 'admin',
    hospitalId: '66c000000000000000000002'
  },
  {
    _id: '66c000000000000000000093',
    id: '66c000000000000000000093',
    email: 'admin@kemhospital.gov.in',
    password: 'KEM@2024',
    name: 'KEM Hospital Admin',
    role: 'admin',
    hospitalId: '66c000000000000000000003'
  },
  {
    _id: '66c000000000000000000094',
    id: '66c000000000000000000094',
    email: 'bloodbank@redcross.org',
    password: 'BloodBank@2024',
    name: 'Red Cross Blood Bank Admin',
    role: 'blood_bank_admin'
  }
];
