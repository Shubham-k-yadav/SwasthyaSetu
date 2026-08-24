import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import connectDB from '../config/db.js';

// Real Indian Hospitals Dataset across 8 Major Metropolitan Regions
const realHospitalsData = [
  // --- DELHI NCR ---
  {
    name: 'AIIMS Delhi (All India Institute of Medical Sciences)',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    phone: '+91-11-26588500',
    email: 'contact@aiims.edu',
    beds: { icu: { total: 180, available: 32 }, general: { total: 1200, available: 210 }, ventilator: { total: 95, available: 14 } },
    specialties: ['Cardiology', 'Neurosurgery', 'Oncology', 'Trauma Center', 'Paediatrics'],
    rating: 4.9
  },
  {
    name: 'Safdarjung Hospital',
    address: 'Ring Road, Opposite AIIMS, Safdarjung Enclave, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5692, lng: 77.2072 },
    phone: '+91-11-26730000',
    email: 'info@safdarjunghospital.nic.in',
    beds: { icu: { total: 120, available: 18 }, general: { total: 900, available: 145 }, ventilator: { total: 60, available: 9 } },
    specialties: ['Burns Unit', 'Orthopedics', 'General Surgery', 'Urology'],
    rating: 4.3
  },
  {
    name: 'Medanta - The Medicity',
    address: 'CH Baktawar Singh Road, Sector 38, Gurugram, Haryana',
    city: 'Gurugram',
    state: 'Haryana',
    coordinates: { lat: 28.4385, lng: 77.0422 },
    phone: '+91-124-4141414',
    email: 'info@medanta.org',
    beds: { icu: { total: 250, available: 45 }, general: { total: 1250, available: 310 }, ventilator: { total: 120, available: 22 } },
    specialties: ['Heart Institute', 'Liver Transplant', 'Neurosciences', 'Kidney Institute'],
    rating: 4.8
  },
  {
    name: 'Fortis Escorts Heart Institute',
    address: 'Okhla Road, Sukhdev Vihar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5606, lng: 77.2743 },
    phone: '+91-11-47135000',
    email: 'contactus.escorts@fortishealthcare.com',
    beds: { icu: { total: 110, available: 24 }, general: { total: 310, available: 58 }, ventilator: { total: 50, available: 11 } },
    specialties: ['Cardiac Surgery', 'Interventional Cardiology', 'Pediatric Cardiology'],
    rating: 4.7
  },
  {
    name: 'Max Super Speciality Hospital Saket',
    address: '1, 2 Press Enclave Marg, Saket, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.5283, lng: 77.2120 },
    phone: '+91-11-26515050',
    email: 'saket@maxhealthcare.com',
    beds: { icu: { total: 140, available: 29 }, general: { total: 500, available: 94 }, ventilator: { total: 70, available: 16 } },
    specialties: ['Oncology', 'Bone Marrow Transplant', 'Robotic Surgery', 'Gastroenterology'],
    rating: 4.7
  },
  {
    name: 'Sir Ganga Ram Hospital',
    address: 'Rajinder Nagar, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6380, lng: 77.1893 },
    phone: '+91-11-25750000',
    email: 'gangaram@sgrh.com',
    beds: { icu: { total: 100, available: 22 }, general: { total: 675, available: 112 }, ventilator: { total: 55, available: 8 } },
    specialties: ['Nephrology', 'Vascular Surgery', 'Rheumatology', 'Pulmonology'],
    rating: 4.6
  },
  {
    name: 'Ram Manohar Lohia (RML) Hospital',
    address: 'Baba Kharak Singh Marg, Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    coordinates: { lat: 28.6247, lng: 77.2023 },
    phone: '+91-11-23365525',
    email: 'rmlhospital@nic.in',
    beds: { icu: { total: 95, available: 12 }, general: { total: 750, available: 130 }, ventilator: { total: 45, available: 6 } },
    specialties: ['Trauma Center', 'Toxicology', 'General Medicine', 'ENT'],
    rating: 4.2
  },

  // --- MUMBAI ---
  {
    name: 'KEM Hospital (King Edward Memorial)',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0024, lng: 72.8424 },
    phone: '+91-22-24107000',
    email: 'kemhospital@mcgm.gov.in',
    beds: { icu: { total: 160, available: 28 }, general: { total: 1800, available: 290 }, ventilator: { total: 80, available: 15 } },
    specialties: ['Cardiovascular Surgery', 'Nephrology', 'Plastic Surgery', 'Trauma'],
    rating: 4.5
  },
  {
    name: 'Lilavati Hospital & Research Centre',
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0518, lng: 72.8288 },
    phone: '+91-22-26751000',
    email: 'info@lilavatihospital.com',
    beds: { icu: { total: 115, available: 19 }, general: { total: 323, available: 64 }, ventilator: { total: 50, available: 10 } },
    specialties: ['Interventional Radiology', 'Pediatric Surgery', 'Gynaecology', 'Orthopedics'],
    rating: 4.8
  },
  {
    name: 'Tata Memorial Hospital Mumbai',
    address: 'Dr. E Borges Road, Parel, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.0048, lng: 72.8435 },
    phone: '+91-22-24177000',
    email: 'crs@tmc.gov.in',
    beds: { icu: { total: 85, available: 8 }, general: { total: 600, available: 42 }, ventilator: { total: 40, available: 4 } },
    specialties: ['Surgical Oncology', 'Radiation Oncology', 'Nuclear Medicine', 'Hematology'],
    rating: 4.9
  },
  {
    name: 'Kokilaben Dhirubhai Ambani Hospital',
    address: 'Rao Saheb, Achutrao Patwardhan Marg, Four Bungalows, Andheri West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    coordinates: { lat: 19.1314, lng: 72.8252 },
    phone: '+91-22-30999999',
    email: 'info.kdah@relianceada.com',
    beds: { icu: { total: 180, available: 34 }, general: { total: 750, available: 160 }, ventilator: { total: 90, available: 18 } },
    specialties: ['Children Institute', 'Bone & Joint', 'Cancer Care', 'Robotic Surgery'],
    rating: 4.8
  },

  // --- BANGALORE ---
  {
    name: 'Manipal Hospital HAL Airport Road',
    address: '98, HAL Old Airport Road, Kodihalli, Bengaluru',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.9591, lng: 77.6470 },
    phone: '+91-80-25024444',
    email: 'info@manipalhospitals.com',
    beds: { icu: { total: 120, available: 25 }, general: { total: 600, available: 110 }, ventilator: { total: 60, available: 12 } },
    specialties: ['Spine Care', 'Organ Transplant', 'Heart Care', 'Neurology'],
    rating: 4.6
  },
  {
    name: 'Narayana Health City (Narayana Hrudayalaya)',
    address: '258, A, Bommasandra Industrial Area, Hosur Road, Bengaluru',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.8122, lng: 77.6942 },
    phone: '+91-80-71222222',
    email: 'info.nh@narayanahealth.org',
    beds: { icu: { total: 300, available: 52 }, general: { total: 2000, available: 410 }, ventilator: { total: 150, available: 28 } },
    specialties: ['Pediatric Cardiac Surgery', 'Bone Marrow Transplant', 'Oncology', 'Vascular Surgery'],
    rating: 4.8
  },
  {
    name: 'Fortis Hospital Bannerghatta',
    address: '154/9, Bannerghatta Main Road, Opposite IIM-B, Bengaluru',
    city: 'Bangalore',
    state: 'Karnataka',
    coordinates: { lat: 12.8954, lng: 77.5988 },
    phone: '+91-80-66214444',
    email: 'bannerghatta@fortishealthcare.com',
    beds: { icu: { total: 90, available: 18 }, general: { total: 400, available: 75 }, ventilator: { total: 45, available: 8 } },
    specialties: ['Cardiac Sciences', 'Urology', 'Orthopedics', 'Neuro Surgery'],
    rating: 4.6
  },

  // --- CHENNAI ---
  {
    name: 'Apollo Hospital Greams Road',
    address: '21, Greams Lane, Thousand Lights, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0604, lng: 80.2496 },
    phone: '+91-44-28290200',
    email: 'greams_info@apollohospitals.com',
    beds: { icu: { total: 150, available: 31 }, general: { total: 560, available: 125 }, ventilator: { total: 75, available: 14 } },
    specialties: ['Cardiology', 'Proton Therapy', 'Transplant Care', 'Orthopedics'],
    rating: 4.8
  },
  {
    name: 'MIOT International Hospital',
    address: '4/112, Mount Poonamallee Road, Manapakkam, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    coordinates: { lat: 13.0238, lng: 80.1884 },
    phone: '+91-44-42002288',
    email: 'miot@miotinternational.com',
    beds: { icu: { total: 110, available: 22 }, general: { total: 500, available: 98 }, ventilator: { total: 50, available: 9 } },
    specialties: ['Joint Replacement', 'Thoracic Surgery', 'Hepatology', 'Nephrology'],
    rating: 4.7
  },

  // --- HYDERABAD ---
  {
    name: 'Yashoda Hospital Secunderabad',
    address: 'Alexander Road, Near Sangeeth Theater, Secunderabad, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    coordinates: { lat: 17.4399, lng: 78.5017 },
    phone: '+91-40-45674567',
    email: 'info@yashodamail.com',
    beds: { icu: { total: 130, available: 27 }, general: { total: 650, available: 140 }, ventilator: { total: 65, available: 12 } },
    specialties: ['Heart & Lung Transplant', 'Neuro Intervention', 'Gastroenterology', 'Oncology'],
    rating: 4.7
  },
  {
    name: 'KIMS Hospital Secunderabad',
    address: '1-8-31/1, Minister Road, Krishna Nagar, Secunderabad, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    coordinates: { lat: 17.4344, lng: 78.4842 },
    phone: '+91-40-44885000',
    email: 'contact@kimshospitals.com',
    beds: { icu: { total: 160, available: 35 }, general: { total: 800, available: 185 }, ventilator: { total: 80, available: 16 } },
    specialties: ['Organ Transplant', 'Cardiac Sciences', 'Robotic Surgery', 'Spine Care'],
    rating: 4.7
  },

  // --- KOLKATA ---
  {
    name: 'SSKM Hospital (Seth Sukhlal Karnani Memorial)',
    address: '244, AJC Bose Road, Bhowanipore, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    coordinates: { lat: 22.5392, lng: 88.3444 },
    phone: '+91-33-22231589',
    email: 'sskm@wbhealth.gov.in',
    beds: { icu: { total: 140, available: 22 }, general: { total: 1500, available: 240 }, ventilator: { total: 70, available: 11 } },
    specialties: ['Nephrology', 'Burn Surgery', 'Cardiology', 'Trauma'],
    rating: 4.4
  },
  {
    name: 'AMRI Hospitals Dhakuria',
    address: 'P-238, CIT Scheme LXXII, Block A, Dhakuria, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    coordinates: { lat: 22.5085, lng: 88.3697 },
    phone: '+91-33-66800000',
    email: 'dhakuria@amrihospitals.in',
    beds: { icu: { total: 85, available: 17 }, general: { total: 350, available: 72 }, ventilator: { total: 40, available: 7 } },
    specialties: ['Critical Care', 'Neuro Surgery', 'Orthopedics', 'Gastro Sciences'],
    rating: 4.5
  },

  // --- PUNE ---
  {
    name: 'Ruby Hall Clinic Pune',
    address: '40, Sassoon Road, Sangamvadi, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    coordinates: { lat: 18.5308, lng: 73.8770 },
    phone: '+91-20-66455100',
    email: 'info@rubyhall.com',
    beds: { icu: { total: 130, available: 26 }, general: { total: 550, available: 118 }, ventilator: { total: 65, available: 13 } },
    specialties: ['Cardiac Surgery', 'Oncology', 'Neurology', 'Kidney Transplant'],
    rating: 4.6
  },

  // --- LUCKNOW ---
  {
    name: 'SGPGI (Sanjay Gandhi Postgraduate Institute of Medical Sciences)',
    address: 'Raebareli Road, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    coordinates: { lat: 26.7465, lng: 80.9380 },
    phone: '+91-522-2668700',
    email: 'director@sgpgi.ac.in',
    beds: { icu: { total: 160, available: 29 }, general: { total: 1000, available: 195 }, ventilator: { total: 85, available: 14 } },
    specialties: ['Gastroenterology', 'Endocrinology', 'Urology', 'Immunology'],
    rating: 4.8
  },
  {
    name: 'King George Medical University (KGMU)',
    address: 'Shah Mina Road, Chowk, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    coordinates: { lat: 26.8687, lng: 80.9168 },
    phone: '+91-522-2257540',
    email: 'vc@kgmcindia.edu',
    beds: { icu: { total: 200, available: 38 }, general: { total: 2200, available: 350 }, ventilator: { total: 100, available: 19 } },
    specialties: ['Trauma Surgery', 'Plastic Surgery', 'Pediatrics', 'Cardiology'],
    rating: 4.6
  }
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

async function importRealHospitals() {
  console.log('=============== SWASTHYA SETU REAL DATA IMPORTER ===============\n');
  try {
    await connectDB();
    console.log('✔ Connected to MongoDB Database');

    // Clean existing hospitals and blood stocks before importing fresh real data
    await Hospital.deleteMany({});
    await BloodStock.deleteMany({});
    console.log('✔ Cleared existing hospital and blood stock collections');

    let hospitalCount = 0;
    let bloodStockCount = 0;

    for (const hospData of realHospitalsData) {
      const hospital = new Hospital({
        name: hospData.name,
        address: hospData.address,
        city: hospData.city,
        state: hospData.state,
        coordinates: hospData.coordinates,
        phone: hospData.phone,
        email: hospData.email,
        beds: hospData.beds,
        specialties: hospData.specialties,
        emergencyServices: true,
        isVerified: true,
        verificationStatus: 'approved',
        rating: hospData.rating,
        lastUpdated: new Date()
      });

      await hospital.save();
      hospitalCount++;

      // Generate blood stock inventory for each real hospital
      for (const group of bloodGroups) {
        const unitsAvailable = Math.floor(Math.random() * 45) + 5;
        const minimumRequired = 10;

        const bloodStock = new BloodStock({
          hospitalId: hospital._id,
          bloodGroup: group,
          unitsAvailable,
          minimumRequired,
          lastUpdated: new Date()
        });

        await bloodStock.save();
        bloodStockCount++;
      }
    }

    console.log('\n======================================================');
    console.log(`🎉 SUCCESS! REAL HOSPITALS DATA IMPORT COMPLETE!`);
    console.log(`   🏥 Real Hospitals Imported : ${hospitalCount} hospitals across 8 metros`);
    console.log(`   🩸 Blood Stock Entries      : ${bloodStockCount} blood stock items`);
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

importRealHospitals();
