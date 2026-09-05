import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import BloodStock from '../models/BloodStock.js';
import Donor from '../models/Donor.js';

async function cleanMockData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to MongoDB Atlas');

    // 1. Delete all simulated/seeded mock hospitals
    const hospRes = await Hospital.deleteMany({
      $or: [
        { isSimulated: true },
        { email: { $in: ['director@aiims.edu', 'info@safdarjunghospital.nic.in', 'info@sgrh.com', 'info@tmc.gov.in', 'dean@kem.edu'] } }
      ]
    });
    console.log(`✔ Deleted ${hospRes.deletedCount} simulated/seed hospitals.`);

    // 2. Delete all seeded dummy blood stock
    const bloodRes = await BloodStock.deleteMany({});
    console.log(`✔ Deleted ${bloodRes.deletedCount} dummy blood stock entries.`);

    // 3. Delete seeded dummy donors
    const dummyEmails = ['rahul.s@example.com', 'priya.p@example.com', 'amit.v@example.com', 'amit.k@example.com'];
    const donorRes = await Donor.deleteMany({ email: { $in: dummyEmails } });
    console.log(`✔ Deleted ${donorRes.deletedCount} dummy donors.`);

    const remainingHospitals = await Hospital.countDocuments();
    const remainingDonors = await Donor.countDocuments();
    const remainingStock = await BloodStock.countDocuments();

    console.log('\n--- Current Live Database State ---');
    console.log('Live Verified Hospitals:', remainingHospitals);
    console.log('Live Donors:', remainingDonors);
    console.log('Live Blood Stock:', remainingStock);

    process.exit(0);
  } catch (err) {
    console.error('Error cleaning mock data:', err);
    process.exit(1);
  }
}

cleanMockData();
