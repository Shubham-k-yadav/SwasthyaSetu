import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * SwasthyaSetu Production Initialization Script
 * NOTE: All mock/demo data seeding has been completely removed.
 * This script only verifies or initializes the master Super Admin account for real platform management.
 */
async function init() {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    console.log('✔ Connected to MongoDB');

    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (!existingSuperAdmin) {
      const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD || 'SwasthyaSetu@2026';
      const superAdmin = new User({
        name: 'Super Admin',
        email: 'superadmin@swasthyasetu.in',
        password: initialPassword,
        role: 'superadmin',
        isActive: true
      });
      await superAdmin.save();
      console.log('✔ Super Admin initialized with email: superadmin@swasthyasetu.in');
    } else {
      console.log(`✔ Super Admin already exists: ${existingSuperAdmin.email}`);
    }

    console.log('✔ Mock/demo data is disabled. SwasthyaSetu is configured for real live users only.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization error:', error.message);
    process.exit(1);
  }
}

init();
