const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const mockHospitals = [
  {
    _id: '66c000000000000000000001',
    name: 'AIIMS Delhi',
    address: 'Ansari Nagar East, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    phone: '+91-11-26588500',
    email: 'director@aiims.edu',
    beds: {
      icu: { total: 150, available: 23 },
      general: { total: 800, available: 156 },
      ventilator: { total: 80, available: 12 }
    },
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Trauma'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.8,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000002',
    name: 'Safdarjung Hospital',
    address: 'Ring Road, Safdarjung Enclave',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5692, lng: 77.2072 },
    phone: '+91-11-26730000',
    email: 'info@safdarjunghospital.nic.in',
    beds: {
      icu: { total: 100, available: 15 },
      general: { total: 600, available: 89 },
      ventilator: { total: 50, available: 8 }
    },
    specialties: ['General Surgery', 'Orthopedics', 'Burn Unit'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.2,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000003',
    name: 'Sir Ganga Ram Hospital',
    address: 'Rajinder Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6380, lng: 77.1893 },
    phone: '+91-11-25750000',
    email: 'info@sgrh.com',
    beds: {
      icu: { total: 80, available: 18 },
      general: { total: 400, available: 72 },
      ventilator: { total: 40, available: 6 }
    },
    specialties: ['Cardiac Surgery', 'Nephrology', 'Gastroenterology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.6,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000004',
    name: 'Tata Memorial Hospital',
    address: 'Dr E Borges Road, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0048, lng: 72.8435 },
    phone: '+91-22-24177000',
    email: 'info@tmc.gov.in',
    beds: {
      icu: { total: 60, available: 5 },
      general: { total: 500, available: 45 },
      ventilator: { total: 35, available: 3 }
    },
    specialties: ['Oncology', 'Radiation Therapy', 'Surgical Oncology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.9,
    lastUpdated: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000005',
    name: 'KEM Hospital',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0004, lng: 72.8386 },
    phone: '+91-22-24136051',
    email: 'kemhospital@mcgm.gov.in',
    beds: {
      icu: { total: 120, available: 28 },
      general: { total: 700, available: 134 },
      ventilator: { total: 60, available: 14 }
    },
    specialties: ['Trauma', 'Burns', 'Pediatrics', 'Neurosurgery'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.3,
    lastUpdated: new Date().toISOString()
  }
];

export const mockDonors = [
  {
    _id: '66c000000000000000000010',
    name: 'Rahul Sharma',
    phone: '+91-9876543210',
    email: 'rahul.sharma@email.com',
    bloodGroup: 'O+',
    city: 'New Delhi',
    state: 'Delhi',
    age: 28,
    weight: 72,
    isAvailable: true,
    totalDonations: 5,
    createdAt: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000011',
    name: 'Priya Patel',
    phone: '+91-9876543211',
    email: 'priya.patel@email.com',
    bloodGroup: 'A+',
    city: 'Mumbai',
    state: 'Maharashtra',
    age: 32,
    weight: 58,
    isAvailable: true,
    totalDonations: 8,
    createdAt: new Date().toISOString()
  },
  {
    _id: '66c000000000000000000012',
    name: 'Amit Kumar',
    phone: '+91-9876543212',
    email: 'amit.kumar@email.com',
    bloodGroup: 'B+',
    city: 'Bangalore',
    state: 'Karnataka',
    age: 25,
    weight: 68,
    isAvailable: true,
    totalDonations: 3,
    createdAt: new Date().toISOString()
  }
];

export const mockBloodStock = [];
mockHospitals.forEach((h, hIdx) => {
  BLOOD_GROUPS.forEach((bg, bgIdx) => {
    mockBloodStock.push({
      _id: `66c00000000000000000100${hIdx}${bgIdx}`,
      hospitalId: {
        _id: h._id,
        name: h.name,
        address: h.address,
        city: h.city,
        phone: h.phone,
        coordinates: h.coordinates
      },
      bloodGroup: bg,
      unitsAvailable: Math.floor(Math.random() * 25) + 5,
      minimumRequired: 5,
      isLow: false,
      lastUpdated: new Date().toISOString()
    });
  });
});

export const mockEmergencies = [
  {
    _id: '66c000000000000000000050',
    patientName: 'Suresh Verma',
    contactNumber: '+91-9899887766',
    location: { lat: 28.5672, lng: 77.2100 },
    city: 'New Delhi',
    address: 'Ring Road, New Delhi',
    emergencyType: 'Trauma / Cardiac',
    description: 'Chest pain and breathlessness',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

export const mockUsers = [
  {
    _id: '66c000000000000000000090',
    email: 'superadmin@swasthyasetu.in',
    password: 'SwasthyaSetu@2026',
    name: 'Super Admin',
    role: 'superadmin'
  },
  {
    _id: '66c000000000000000000091',
    email: 'admin@aiims.edu',
    password: 'AIIMS@2024',
    name: 'AIIMS Admin',
    role: 'admin',
    hospitalId: '66c000000000000000000001'
  }
];
