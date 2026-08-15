import 'dotenv/config';
import mongoose from 'mongoose';
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
  },
  {
    name: 'Christian Medical College',
    address: 'Ida Scudder Road, Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    coordinates: { lat: 12.9237, lng: 79.1352 },
    phone: '+91-416-2281000',
    email: 'cmcvellore@cmcvellore.ac.in',
    beds: {
      icu: { total: 100, available: 22 },
      general: { total: 600, available: 98 },
      ventilator: { total: 45, available: 9 }
    },
    specialties: ['Cardiology', 'Neurology', 'Plastic Surgery', 'Orthopedics'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.7
  },
  {
    name: 'Apollo Hospital Chennai',
    address: '21 Greams Lane, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0604, lng: 80.2496 },
    phone: '+91-44-28290200',
    email: 'info@apollohospitals.com',
    beds: {
      icu: { total: 90, available: 12 },
      general: { total: 450, available: 67 },
      ventilator: { total: 55, available: 7 }
    },
    specialties: ['Heart Surgery', 'Liver Transplant', 'Joint Replacement'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.5
  },
  {
    name: 'Manipal Hospital Bangalore',
    address: '98 HAL Airport Road, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9591, lng: 77.6470 },
    phone: '+91-80-25024444',
    email: 'info@manipalhospitals.com',
    beds: {
      icu: { total: 85, available: 19 },
      general: { total: 380, available: 54 },
      ventilator: { total: 42, available: 8 }
    },
    specialties: ['Oncology', 'Nephrology', 'Spine Surgery'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.4
  },
  {
    name: 'PGIMER Chandigarh',
    address: 'Sector 12, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    coordinates: { lat: 30.7644, lng: 76.7777 },
    phone: '+91-172-2756565',
    email: 'director@pgimer.edu.in',
    beds: {
      icu: { total: 130, available: 31 },
      general: { total: 750, available: 112 },
      ventilator: { total: 70, available: 16 }
    },
    specialties: ['Cardiology', 'Gastroenterology', 'Pulmonology', 'Hematology'],
    emergencyServices: true,
    isVerified: true,
    rating: 4.6
  },
  {
    name: 'Ruby Hall Clinic',
    address: '40 Sassoon Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    coordinates: { lat: 18.5273, lng: 73.8766 },
    phone: '+91-20-26163391',
    email: 'info@rubyhall.com',
    beds: {
      icu: { total: 70, available: 11 },
      general: { total: 350, available: 48 },
      ventilator: { total: 35, available: 5 }
    },
    specialties: ['Cardiac Care', 'Orthopedics', 'Nephrology'],
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
  },
  {
    name: 'Sunita Verma',
    phone: '+91-9876543213',
    email: 'sunita.verma@email.com',
    bloodGroup: 'AB+',
    city: 'Chennai',
    state: 'Tamil Nadu',
    age: 30,
    weight: 55,
    isAvailable: true,
    totalDonations: 6
  },
  {
    name: 'Mohammed Ali',
    phone: '+91-9876543214',
    email: 'mohammed.ali@email.com',
    bloodGroup: 'O-',
    city: 'Pune',
    state: 'Maharashtra',
    age: 35,
    weight: 75,
    isAvailable: true,
    totalDonations: 12
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

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/medlink';

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    await Hospital.deleteMany({});
    await BloodStock.deleteMany({});
    await Donor.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing data');

    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`Created ${createdHospitals.length} hospitals`);

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
    
    const createdBloodStock = await BloodStock.insertMany(bloodStockEntries);
    console.log(`Created ${createdBloodStock.length} blood stock entries`);

    const createdDonors = await Donor.insertMany(donors);
    console.log(`Created ${createdDonors.length} donors`);

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
    console.log(`Created ${adminUsers.length} admin users`);

    console.log('\n=== Seed Complete ===');
    console.log('\nAdmin Credentials:');
    console.log('Super Admin: superadmin@medlink.com / MedLink@2024');
    console.log('AIIMS Admin: admin@aiims.edu / AIIMS@2024');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
