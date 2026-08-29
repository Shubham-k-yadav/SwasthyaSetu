import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';

async function activateVerifiedUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to DB');

    const verifiedHospitals = await Hospital.find({ isVerified: true }).lean();
    console.log(`🏥 Found ${verifiedHospitals.length} verified hospitals in DB`);

    for (const h of verifiedHospitals) {
      const hospObjId = new mongoose.Types.ObjectId(h._id);
      const res = await User.updateMany(
        {
          $or: [
            { hospitalId: hospObjId },
            { hospitalId: h._id.toString() },
            { email: h.email },
            { email: h.adminEmail }
          ]
        },
        { $set: { isActive: true } }
      );
      console.log(`✔ Activated users for hospital "${h.name}": ${res.modifiedCount} updated`);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

activateVerifiedUsers();
