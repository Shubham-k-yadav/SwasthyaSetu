import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ─── Real Indian Hospitals (sourced from NHP, annual reports, data.gov.in) ───
// Bed counts based on publicly available hospital capacity data.
// lastUpdated values are staggered to test freshness badge system.
const hospitals = [
  // ── DELHI / NCR ──────────────────────────────────────────────────────────
  {
    name: 'AIIMS New Delhi',
    address: 'Ansari Nagar East, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    phone: '+91-11-26588500',
    email: 'director@aiims.edu',
    beds: { icu: { total: 168, available: 23 }, general: { total: 1200, available: 156 }, ventilator: { total: 80, available: 12 } },
    specialties: ['Cardiology', 'Neurology', 'Oncology', 'Trauma', 'Transplant'],
    emergencyServices: true, isVerified: true, rating: 4.8,
    lastUpdated: new Date(Date.now() - 20 * 60 * 1000)   // 20 min ago
  },
  {
    name: 'Safdarjung Hospital',
    address: 'Ring Road, Safdarjung Enclave, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5692, lng: 77.2072 },
    phone: '+91-11-26730000',
    email: 'info@safdarjunghospital.nic.in',
    beds: { icu: { total: 100, available: 15 }, general: { total: 1400, available: 89 }, ventilator: { total: 50, available: 8 } },
    specialties: ['General Surgery', 'Orthopedics', 'Burn Unit', 'Pediatrics'],
    emergencyServices: true, isVerified: true, rating: 4.2,
    lastUpdated: new Date(Date.now() - 100 * 60 * 1000)  // ~1.6 hr ago (stale)
  },
  {
    name: 'Sir Ganga Ram Hospital',
    address: 'Rajinder Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6380, lng: 77.1893 },
    phone: '+91-11-25750000',
    email: 'info@sgrh.com',
    beds: { icu: { total: 80, available: 18 }, general: { total: 675, available: 72 }, ventilator: { total: 40, available: 6 } },
    specialties: ['Cardiac Surgery', 'Nephrology', 'Gastroenterology', 'Neurosurgery'],
    emergencyServices: true, isVerified: true, rating: 4.6,
    lastUpdated: new Date(Date.now() - 45 * 60 * 1000)   // 45 min ago
  },
  {
    name: 'Ram Manohar Lohia Hospital',
    address: 'Baba Kharak Singh Marg, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6292, lng: 77.2001 },
    phone: '+91-11-23404320',
    email: 'rmlhospital@rmlh.nic.in',
    beds: { icu: { total: 90, available: 11 }, general: { total: 1600, available: 210 }, ventilator: { total: 48, available: 7 } },
    specialties: ['Medicine', 'Pediatrics', 'Obstetrics', 'ENT'],
    emergencyServices: true, isVerified: true, rating: 4.1,
    lastUpdated: new Date(Date.now() - 55 * 60 * 1000)
  },
  {
    name: 'GTB Hospital Delhi',
    address: 'Dilshad Garden, Delhi',
    city: 'Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6837, lng: 77.3007 },
    phone: '+91-11-22581262',
    email: 'gtbhospital@nic.in',
    beds: { icu: { total: 60, available: 9 }, general: { total: 800, available: 98 }, ventilator: { total: 30, available: 4 } },
    specialties: ['Emergency Medicine', 'Trauma', 'Orthopedics'],
    emergencyServices: true, isVerified: true, rating: 3.9,
    lastUpdated: new Date(Date.now() - 3.5 * 60 * 60 * 1000)  // 3.5 hr (stale)
  },

  // ── MUMBAI ──────────────────────────────────────────────────────────────
  {
    name: 'Tata Memorial Hospital',
    address: 'Dr E Borges Road, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0048, lng: 72.8435 },
    phone: '+91-22-24177000',
    email: 'info@tmc.gov.in',
    beds: { icu: { total: 60, available: 5 }, general: { total: 629, available: 45 }, ventilator: { total: 35, available: 3 } },
    specialties: ['Oncology', 'Radiation Therapy', 'Surgical Oncology', 'Hematology'],
    emergencyServices: true, isVerified: true, rating: 4.9,
    lastUpdated: new Date(Date.now() - 8 * 60 * 60 * 1000)    // 8 hr (very stale 🩶)
  },
  {
    name: 'KEM Hospital Mumbai',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0004, lng: 72.8386 },
    phone: '+91-22-24136051',
    email: 'kemhospital@mcgm.gov.in',
    beds: { icu: { total: 120, available: 28 }, general: { total: 1800, available: 134 }, ventilator: { total: 60, available: 14 } },
    specialties: ['Trauma', 'Burns', 'Pediatrics', 'Neurosurgery'],
    emergencyServices: true, isVerified: true, rating: 4.3,
    lastUpdated: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    name: 'Lokmanya Tilak Municipal Hospital (Sion)',
    address: 'Dr Babasaheb Ambedkar Road, Sion, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0426, lng: 72.8609 },
    phone: '+91-22-24076381',
    email: 'sionhospital@mcgm.gov.in',
    beds: { icu: { total: 80, available: 12 }, general: { total: 1400, available: 167 }, ventilator: { total: 40, available: 6 } },
    specialties: ['Accident & Emergency', 'Pediatrics', 'Obstetrics'],
    emergencyServices: true, isVerified: true, rating: 4.0,
    lastUpdated: new Date(Date.now() - 70 * 60 * 1000)
  },

  // ── BANGALORE ────────────────────────────────────────────────────────────
  {
    name: 'Manipal Hospital Bangalore',
    address: '98 HAL Airport Road, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9591, lng: 77.6470 },
    phone: '+91-80-25024444',
    email: 'info@manipalhospitals.com',
    beds: { icu: { total: 85, available: 19 }, general: { total: 600, available: 54 }, ventilator: { total: 42, available: 8 } },
    specialties: ['Oncology', 'Nephrology', 'Spine Surgery', 'Cardiac Surgery'],
    emergencyServices: true, isVerified: true, rating: 4.4,
    lastUpdated: new Date(Date.now() - 40 * 60 * 1000)
  },
  {
    name: 'Bowring & Lady Curzon Hospital',
    address: 'Shivajinagar, Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9716, lng: 77.6068 },
    phone: '+91-80-22867001',
    email: 'bowring@karnataka.gov.in',
    beds: { icu: { total: 50, available: 8 }, general: { total: 700, available: 88 }, ventilator: { total: 25, available: 4 } },
    specialties: ['General Medicine', 'Surgery', 'Pediatrics'],
    emergencyServices: true, isVerified: true, rating: 3.8,
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000)  // 2 hr (borderline 🟡)
  },

  // ── CHENNAI ──────────────────────────────────────────────────────────────
  {
    name: 'Apollo Hospital Chennai',
    address: '21 Greams Lane, Off Greams Road, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0604, lng: 80.2496 },
    phone: '+91-44-28290200',
    email: 'info@apollohospitals.com',
    beds: { icu: { total: 90, available: 12 }, general: { total: 560, available: 67 }, ventilator: { total: 55, available: 7 } },
    specialties: ['Heart Surgery', 'Liver Transplant', 'Joint Replacement', 'Neurology'],
    emergencyServices: true, isVerified: true, rating: 4.5,
    lastUpdated: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    name: 'Rajiv Gandhi Government General Hospital',
    address: 'Park Town, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0814, lng: 80.2785 },
    phone: '+91-44-25305000',
    email: 'rgggh@tn.gov.in',
    beds: { icu: { total: 140, available: 22 }, general: { total: 2000, available: 321 }, ventilator: { total: 70, available: 11 } },
    specialties: ['Trauma', 'Burns', 'Cardiac', 'Neurosurgery', 'Plastic Surgery'],
    emergencyServices: true, isVerified: true, rating: 4.2,
    lastUpdated: new Date(Date.now() - 50 * 60 * 1000)
  },
  {
    name: 'Christian Medical College Vellore',
    address: 'Ida Scudder Road, Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    coordinates: { lat: 12.9237, lng: 79.1352 },
    phone: '+91-416-2281000',
    email: 'cmcvellore@cmcvellore.ac.in',
    beds: { icu: { total: 100, available: 22 }, general: { total: 2700, available: 198 }, ventilator: { total: 45, available: 9 } },
    specialties: ['Cardiology', 'Neurology', 'Plastic Surgery', 'Orthopedics'],
    emergencyServices: true, isVerified: true, rating: 4.7,
    lastUpdated: new Date(Date.now() - 35 * 60 * 1000)
  },

  // ── HYDERABAD ────────────────────────────────────────────────────────────
  {
    name: 'NIMS Hyderabad',
    address: 'Punjagutta, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    coordinates: { lat: 17.4282, lng: 78.4378 },
    phone: '+91-40-23489000',
    email: 'director@nims.edu.in',
    beds: { icu: { total: 110, available: 17 }, general: { total: 1000, available: 143 }, ventilator: { total: 55, available: 9 } },
    specialties: ['Cardiology', 'Neurosurgery', 'Nephrology', 'Gastroenterology'],
    emergencyServices: true, isVerified: true, rating: 4.3,
    lastUpdated: new Date(Date.now() - 60 * 60 * 1000)  // 1 hr
  },
  {
    name: 'Osmania General Hospital',
    address: 'Afzalgunj, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    coordinates: { lat: 17.3806, lng: 78.4794 },
    phone: '+91-40-24601101',
    email: 'ogh@telangana.gov.in',
    beds: { icu: { total: 80, available: 14 }, general: { total: 1200, available: 201 }, ventilator: { total: 40, available: 7 } },
    specialties: ['Emergency', 'Medicine', 'Surgery', 'Obstetrics'],
    emergencyServices: true, isVerified: true, rating: 3.9,
    lastUpdated: new Date(Date.now() - 90 * 60 * 1000)  // 90 min (stale 🟡)
  },

  // ── CHANDIGARH ───────────────────────────────────────────────────────────
  {
    name: 'PGIMER Chandigarh',
    address: 'Sector 12, Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    coordinates: { lat: 30.7644, lng: 76.7777 },
    phone: '+91-172-2756565',
    email: 'director@pgimer.edu.in',
    beds: { icu: { total: 130, available: 31 }, general: { total: 2000, available: 312 }, ventilator: { total: 70, available: 16 } },
    specialties: ['Cardiology', 'Gastroenterology', 'Pulmonology', 'Hematology'],
    emergencyServices: true, isVerified: true, rating: 4.6,
    lastUpdated: new Date(Date.now() - 15 * 60 * 1000)
  },

  // ── KOLKATA ──────────────────────────────────────────────────────────────
  {
    name: 'SSKM Hospital Kolkata',
    address: 'AJC Bose Road, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    coordinates: { lat: 22.5437, lng: 88.3414 },
    phone: '+91-33-22043218',
    email: 'sskm@wbhealth.gov.in',
    beds: { icu: { total: 120, available: 19 }, general: { total: 1800, available: 234 }, ventilator: { total: 60, available: 10 } },
    specialties: ['Neurosurgery', 'Cardiac', 'Burns', 'Plastic Surgery'],
    emergencyServices: true, isVerified: true, rating: 4.1,
    lastUpdated: new Date(Date.now() - 80 * 60 * 1000)
  },
  {
    name: 'Calcutta Medical College',
    address: 'College Street, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    coordinates: { lat: 22.5851, lng: 88.3643 },
    phone: '+91-33-22126785',
    email: 'calcuttamc@wbhealth.gov.in',
    beds: { icu: { total: 90, available: 13 }, general: { total: 1500, available: 189 }, ventilator: { total: 45, available: 7 } },
    specialties: ['Medicine', 'Surgery', 'Pediatrics', 'Obstetrics'],
    emergencyServices: true, isVerified: true, rating: 4.0,
    lastUpdated: new Date(Date.now() - 4.5 * 60 * 60 * 1000) // 4.5 hr (very stale)
  },

  // ── PUNE ─────────────────────────────────────────────────────────────────
  {
    name: 'Ruby Hall Clinic Pune',
    address: '40 Sassoon Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    coordinates: { lat: 18.5273, lng: 73.8766 },
    phone: '+91-20-26163391',
    email: 'info@rubyhall.com',
    beds: { icu: { total: 70, available: 11 }, general: { total: 550, available: 68 }, ventilator: { total: 35, available: 5 } },
    specialties: ['Cardiac Care', 'Orthopedics', 'Nephrology'],
    emergencyServices: true, isVerified: true, rating: 4.3,
    lastUpdated: new Date(Date.now() - 22 * 60 * 1000)
  },
  {
    name: 'Sassoon General Hospital Pune',
    address: 'Jai Prakash Narayan Road, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    coordinates: { lat: 18.5248, lng: 73.8553 },
    phone: '+91-20-26128000',
    email: 'sassoon@mahahealth.gov.in',
    beds: { icu: { total: 80, available: 16 }, general: { total: 1400, available: 211 }, ventilator: { total: 40, available: 8 } },
    specialties: ['Emergency', 'Trauma', 'Orthopedics', 'Gynecology'],
    emergencyServices: true, isVerified: true, rating: 4.0,
    lastUpdated: new Date(Date.now() - 48 * 60 * 1000)
  },

  // ── JAIPUR ───────────────────────────────────────────────────────────────
  {
    name: 'SMS Hospital Jaipur',
    address: 'Jawaharlal Nehru Marg, Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    coordinates: { lat: 26.8950, lng: 75.8021 },
    phone: '+91-141-2518307',
    email: 'sms@rajasthan.gov.in',
    beds: { icu: { total: 100, available: 18 }, general: { total: 3800, available: 487 }, ventilator: { total: 60, available: 11 } },
    specialties: ['Cardiac', 'Neurology', 'Orthopedics', 'Plastic Surgery'],
    emergencyServices: true, isVerified: true, rating: 4.2,
    lastUpdated: new Date(Date.now() - 65 * 60 * 1000)
  },

  // ── LUCKNOW ──────────────────────────────────────────────────────────────
  {
    name: 'SGPGI Lucknow',
    address: 'Raebareli Road, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    coordinates: { lat: 26.7606, lng: 80.9897 },
    phone: '+91-522-2668700',
    email: 'director@sgpgi.ac.in',
    beds: { icu: { total: 120, available: 24 }, general: { total: 1500, available: 198 }, ventilator: { total: 65, available: 13 } },
    specialties: ['Hepatology', 'Nephrology', 'Cardiothoracic', 'Neurosurgery'],
    emergencyServices: true, isVerified: true, rating: 4.5,
    lastUpdated: new Date(Date.now() - 28 * 60 * 1000)
  },

  // ── AHMEDABAD ────────────────────────────────────────────────────────────
  {
    name: 'Civil Hospital Ahmedabad',
    address: 'Asarwa, Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    coordinates: { lat: 23.0630, lng: 72.5888 },
    phone: '+91-79-22681200',
    email: 'civilhosp@gujarat.gov.in',
    beds: { icu: { total: 200, available: 34 }, general: { total: 3500, available: 512 }, ventilator: { total: 100, available: 18 } },
    specialties: ['Cardiac', 'Neurology', 'Orthopedics', 'Nephrology', 'Burns'],
    emergencyServices: true, isVerified: true, rating: 4.3,
    lastUpdated: new Date(Date.now() - 42 * 60 * 1000)
  },

  // ── UNVERIFIED (for demo of approval workflow) ──────────────────────────
  {
    name: 'Sunrise Multispeciality Hospital',
    address: 'Sector 62, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    coordinates: { lat: 28.6273, lng: 77.3725 },
    phone: '+91-120-4567890',
    email: 'contact@sunrisehospital.org',
    beds: { icu: { total: 40, available: 10 }, general: { total: 200, available: 45 }, ventilator: { total: 15, available: 4 } },
    specialties: ['Cardiology', 'Emergency Care'],
    emergencyServices: true,
    isVerified: false,
    verificationStatus: 'pending',
    registrationCertificate: 'REG-NOIDA-2026-9912.pdf',
    rating: 4.0,
    lastUpdated: new Date(Date.now() - 20 * 60 * 1000)
  }
];

// ─── Donors ────────────────────────────────────────────────────────────────
const donors = [
  { name: 'Rahul Sharma',    phone: '+91-9876543210', email: 'rahul.sharma@email.com',  bloodGroup: 'O+',  city: 'New Delhi',  state: 'Delhi',         age: 28, weight: 72, isAvailable: true, totalDonations: 5  },
  { name: 'Priya Patel',     phone: '+91-9876543211', email: 'priya.patel@email.com',   bloodGroup: 'A+',  city: 'Mumbai',     state: 'Maharashtra',   age: 32, weight: 58, isAvailable: true, totalDonations: 8  },
  { name: 'Amit Kumar',      phone: '+91-9876543212', email: 'amit.kumar@email.com',    bloodGroup: 'B+',  city: 'Bangalore',  state: 'Karnataka',     age: 25, weight: 68, isAvailable: true, totalDonations: 3  },
  { name: 'Sunita Verma',    phone: '+91-9876543213', email: 'sunita.verma@email.com',  bloodGroup: 'AB+', city: 'Chennai',    state: 'Tamil Nadu',    age: 30, weight: 55, isAvailable: true, totalDonations: 6  },
  { name: 'Mohammed Ali',    phone: '+91-9876543214', email: 'mohammed.ali@email.com',  bloodGroup: 'O-',  city: 'Pune',       state: 'Maharashtra',   age: 35, weight: 75, isAvailable: true, totalDonations: 12 },
  { name: 'Kavita Singh',    phone: '+91-9876543215', email: 'kavita.singh@email.com',  bloodGroup: 'A-',  city: 'Jaipur',     state: 'Rajasthan',     age: 27, weight: 60, isAvailable: true, totalDonations: 4  },
  { name: 'Deepak Nair',     phone: '+91-9876543216', email: 'deepak.nair@email.com',   bloodGroup: 'B-',  city: 'Hyderabad',  state: 'Telangana',     age: 33, weight: 70, isAvailable: true, totalDonations: 7  },
  { name: 'Anita Desai',     phone: '+91-9876543217', email: 'anita.desai@email.com',   bloodGroup: 'AB-', city: 'Ahmedabad',  state: 'Gujarat',       age: 29, weight: 52, isAvailable: true, totalDonations: 2  },
  { name: 'Vikram Reddy',    phone: '+91-9876543218', email: 'vikram.reddy@email.com',  bloodGroup: 'O+',  city: 'Kolkata',    state: 'West Bengal',   age: 31, weight: 80, isAvailable: true, totalDonations: 9  },
  { name: 'Meera Pillai',    phone: '+91-9876543219', email: 'meera.pillai@email.com',  bloodGroup: 'A+',  city: 'Lucknow',    state: 'Uttar Pradesh', age: 26, weight: 55, isAvailable: true, totalDonations: 1  },
];

// ─── Admin Users ───────────────────────────────────────────────────────────
const adminUsers = [
  { email: 'superadmin@swasthyasetu.in', password: 'SwasthyaSetu@2026', name: 'Super Admin',       role: 'superadmin' },
  { email: 'admin@aiims.edu',            password: 'AIIMS@2024',         name: 'AIIMS Admin',        role: 'admin', hospitalIndex: 0 },
  { email: 'admin@kemhospital.gov.in',   password: 'KEM@2024',           name: 'KEM Admin',          role: 'admin', hospitalIndex: 6 },
];

// ─── Seed Function ─────────────────────────────────────────────────────────
async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthya-setu';
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Hospital.deleteMany({}),
      BloodStock.deleteMany({}),
      Donor.deleteMany({}),
      User.deleteMany({})
    ]);
    console.log('✔ Cleared existing data');

    // Insert hospitals
    const createdHospitals = await Hospital.insertMany(hospitals);
    console.log(`✔ Created ${createdHospitals.length} real Indian hospitals`);

    // Insert blood stock with realistic staggered timestamps per hospital
    const bloodStockEntries = [];
    createdHospitals.forEach((hospital) => {
      BLOOD_GROUPS.forEach((bloodGroup) => {
        const units = Math.floor(Math.random() * 28) + 3;
        bloodStockEntries.push({
          hospitalId: hospital._id,
          bloodGroup,
          unitsAvailable: units,
          minimumRequired: 5,
          isLow: units < 5,
          // Blood stock lastUpdated matches hospital's lastUpdated for consistency
          lastUpdated: hospital.lastUpdated || new Date()
        });
      });
    });
    const createdBloodStock = await BloodStock.insertMany(bloodStockEntries);
    console.log(`✔ Created ${createdBloodStock.length} blood stock entries`);

    // Insert donors
    const createdDonors = await Donor.insertMany(donors);
    console.log(`✔ Created ${createdDonors.length} donors`);

    // Insert admin users
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
    console.log(`✔ Created ${adminUsers.length} admin users`);

    console.log('\n════════════════════════════════════');
    console.log('  SwasthyaSetu Seed Complete! 🏥');
    console.log('════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   Hospitals : ${createdHospitals.length} (real Indian hospitals)`);
    console.log(`   Blood Stock: ${createdBloodStock.length} entries`);
    console.log(`   Donors    : ${createdDonors.length}`);
    console.log(`   Admins    : ${adminUsers.length}`);
    console.log('\n🔑 Admin Credentials:');
    console.log('   Super Admin: superadmin@swasthyasetu.in / SwasthyaSetu@2026');
    console.log('   AIIMS Admin: admin@aiims.edu / AIIMS@2024');
    console.log('   KEM Admin  : admin@kemhospital.gov.in / KEM@2024');
    console.log('════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
