import 'dotenv/config';
import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import { getCoordinatesForCity } from '../utils/geo.js';

async function fixHospitalCoordinates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✔ Connected to DB');

    const hospitals = await Hospital.find({}).lean();
    console.log(`🏥 Fixing coordinates for ${hospitals.length} hospitals in MongoDB...`);

    for (const h of hospitals) {
      const newCoords = getCoordinatesForCity(h.city);
      await Hospital.updateOne(
        { _id: h._id },
        { $set: { coordinates: newCoords } }
      );
      console.log(`✔ Updated "${h.name}" (${h.city}) -> Coordinates: Lat ${newCoords.lat}, Lng ${newCoords.lng}`);
    }

    console.log('\n✅ All hospital map pin coordinates updated to their exact cities!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating hospital coordinates:', err);
    process.exit(1);
  }
}

fixHospitalCoordinates();
