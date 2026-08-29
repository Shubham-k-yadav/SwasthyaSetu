import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import { generateToken } from '../middleware/auth.js';

async function testPendingQueue() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to DB');

    const superadmin = await User.findOne({ role: 'superadmin' });
    if (!superadmin) {
      console.log('❌ Superadmin user not found!');
      process.exit(1);
    }

    const token = generateToken(superadmin);
    console.log('🔑 Superadmin token:', token.slice(0, 20) + '...');

    const unverifiedHospitals = await Hospital.find({ isVerified: false }).lean();
    console.log(`🏥 Unverified hospitals found directly in DB: ${unverifiedHospitals.length}`);
    unverifiedHospitals.forEach(h => console.log(` - ID: ${h._id}, Name: ${h.name}, isVerified: ${h.isVerified}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testPendingQueue();
