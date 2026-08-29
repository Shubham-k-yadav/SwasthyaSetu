import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodBank from '../models/BloodBank.js';
import Ambulance from '../models/Ambulance.js';
import User from '../models/User.js';

async function testDatabaseQueries() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✔ Connected to MongoDB successfully!\n');

    const totalHospitals = await Hospital.countDocuments();
    const verifiedHospitals = await Hospital.countDocuments({ isVerified: true });
    const pendingHospitals = await Hospital.countDocuments({ isVerified: false });
    const sampleHospitals = await Hospital.find().limit(5).lean();

    const totalBloodBanks = await BloodBank.countDocuments();
    const pendingBloodBanks = await BloodBank.countDocuments({ isVerified: false });

    const totalAmbulances = await Ambulance.countDocuments();
    const pendingAmbulances = await Ambulance.countDocuments({ isVerified: false });

    const totalUsers = await User.countDocuments();
    const superAdmins = await User.find({ role: 'superadmin' }).select('email name role').lean();

    console.log('📊 ===== MONGODB LIVE DATABASE REPORT =====');
    console.log(`🏥 Total Hospitals in DB: ${totalHospitals} (Verified: ${verifiedHospitals}, Pending Approval: ${pendingHospitals})`);
    console.log(`🩸 Total Blood Banks in DB: ${totalBloodBanks} (Pending Approval: ${pendingBloodBanks})`);
    console.log(`🚑 Total Ambulances in DB: ${totalAmbulances} (Pending Approval: ${pendingAmbulances})`);
    console.log(`👤 Total Registered Users in DB: ${totalUsers}`);
    console.log(`👑 Super Admin Users:`, JSON.stringify(superAdmins, null, 2));

    if (sampleHospitals.length > 0) {
      console.log('\n🏥 Sample Hospitals in DB:');
      sampleHospitals.forEach((h, i) => {
        console.log(`  [${i + 1}] Name: "${h.name}" | City: "${h.city}" | Verified: ${h.isVerified} | ID: ${h._id}`);
      });
    } else {
      console.log('\nℹ️ No hospitals registered yet in MongoDB. (Database is 100% clean in Zero-Data state)');
    }

    console.log('===========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error querying MongoDB:', error);
    process.exit(1);
  }
}

testDatabaseQueries();
