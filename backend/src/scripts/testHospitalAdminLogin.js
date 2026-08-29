import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';

async function checkHospitalUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to DB');

    const users = await User.find({ role: 'admin' }).lean();
    console.log(`\n📋 Found ${users.length} hospital admin users in DB:`);
    
    for (const u of users) {
      const hosp = u.hospitalId ? await Hospital.findById(u.hospitalId).lean() : null;
      console.log(`- User Email: "${u.email}" | Name: "${u.name}" | isActive: ${u.isActive} | HospitalId: ${u.hospitalId}`);
      if (hosp) {
        console.log(`  -> Linked Hospital: "${hosp.name}" | City: "${hosp.city}" | isVerified: ${hosp.isVerified}`);
      } else {
        console.log(`  -> ⚠️ NO LINKED HOSPITAL FOUND for ID ${u.hospitalId}`);
      }
    }

    const unverifiedHospitals = await Hospital.find({ isVerified: false }).lean();
    const verifiedHospitals = await Hospital.find({ isVerified: true }).lean();

    console.log(`\n🏥 Hospitals Summary:`);
    console.log(`  - Verified Hospitals (${verifiedHospitals.length}):`, verifiedHospitals.map(h => `${h.name} (${h._id})`).join(', '));
    console.log(`  - Unverified Hospitals (${unverifiedHospitals.length}):`, unverifiedHospitals.map(h => `${h.name} (${h._id})`).join(', '));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkHospitalUsers();
