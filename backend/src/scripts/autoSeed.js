import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const hospitals = [
  {
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
    rating: 4.8
  },
  {
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
    rating: 4.2
  },
  {
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
    rating: 4.6
  },
  {
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
    rating: 4.9
  },
  {
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
    rating: 4.3
  }
];

const donors = [
  {
    name: 'Rahul Sharma',
    phone: '+91-9876543210',
    email: 'rahul.sharma@email.com',
    bloodGroup: 'O+',
    city: 'New Delhi',
    state: 'Delhi',
    age: 28,
    weight: 72,
    isAvailable: true,
    totalDonations: 5
  },
  {
    name: 'Priya Patel',
    phone: '+91-9876543211',
    email: 'priya.patel@email.com',
    bloodGroup: 'A+',
    city: 'Mumbai',
    state: 'Maharashtra',
    age: 32,
    weight: 58,
    isAvailable: true,
    totalDonations: 8
  },
  {
    name: 'Amit Kumar',
    phone: '+91-9876543212',
    email: 'amit.kumar@email.com',
    bloodGroup: 'B+',
    city: 'Bangalore',
    state: 'Karnataka',
    age: 25,
    weight: 68,
    isAvailable: true,
    totalDonations: 3
  }
];

const adminUsers = [
  {
    email: 'superadmin@medlink.com',
    password: 'MedLink@2024',
    name: 'Super Admin',
    role: 'superadmin'
  },
  {
    email: 'admin@aiims.edu',
    password: 'AIIMS@2024',
    name: 'AIIMS Admin',
    role: 'admin',
    hospitalIndex: 0
  }
];

export async function autoSeedData() {
  try {
    const existingHospitals = await Hospital.countDocuments();
    if (existingHospitals > 0) {
      console.log('Database already populated.');
      return;
    }

    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`✔ Auto-Seeded ${createdHospitals.length} hospitals`);

    const bloodStockEntries = [];
    for (const hospital of createdHospitals) {
      for (const bloodGroup of BLOOD_GROUPS) {
        bloodStockEntries.push({
          hospitalId: hospital._id,
          bloodGroup,
          unitsAvailable: Math.floor(Math.random() * 30) + 5,
          minimumRequired: 5,
          isLow: false
        });
      }
    }
    
    await BloodStock.insertMany(bloodStockEntries);
    await Donor.insertMany(donors);

    for (const adminData of adminUsers) {
      const userData = {
        email: adminData.email,
        password: adminData.password,
        name: adminData.name,
        role: adminData.role
      };

      if (adminData.hospitalIndex !== undefined) {
        userData.hospitalId = createdHospitals[adminData.hospitalIndex]._id;
      }

      const user = new User(userData);
      await user.save();
    }
    console.log('✔ Auto-Seeded Admin credentials & initial data successfully!');
  } catch (error) {
    console.error('Auto seed error:', error.message);
  }
}
