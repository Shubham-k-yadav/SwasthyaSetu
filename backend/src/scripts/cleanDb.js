import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodBank from '../models/BloodBank.js';
import Ambulance from '../models/Ambulance.js';
import BloodStock from '../models/BloodStock.js';
import Donor from '../models/Donor.js';
import User from '../models/User.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import BedReservation from '../models/BedReservation.js';

async function cleanDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI missing in .env');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB to wipe demo data...');
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB');

    // Wipe all collections
    await Hospital.deleteMany({});
    await BloodBank.deleteMany({});
    await Ambulance.deleteMany({});
    await BloodStock.deleteMany({});
    await Donor.deleteMany({});
    await EmergencyRequest.deleteMany({});
    await BedReservation.deleteMany({});
    await User.deleteMany({});

    console.log('✔ Cleared all Hospitals, Blood Banks, Ambulances, Stocks, Donors, and Emergency Requests');

    // Seed default Super Admin account
    const superAdmin = new User({
      email: 'superadmin@swasthyasetu.in',
      password: 'SwasthyaSetu@2026',
      name: 'National Health Super Admin',
      role: 'superadmin',
      isActive: true
    });

    await superAdmin.save();
    console.log('✔ Super Admin account initialized: superadmin@swasthyasetu.in');

    console.log('\n════════════════════════════════════');
    console.log('  Database Clean Complete! 🧹 (Zero Data State)');
    console.log('════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
