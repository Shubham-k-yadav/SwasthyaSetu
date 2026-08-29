import mongoose, { Schema } from 'mongoose';

const BloodBankSchema = new Schema({
  name: { type: String, required: true, index: true },
  licenseNumber: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, default: 'India', index: true },
  phone: { type: String, required: true },
  adminEmail: { type: String, required: true, lowercase: true },
  passwordHash: { type: String },
  isVerified: { type: Boolean, default: false, index: true },
  isBlockchainVerified: { type: Boolean, default: false },
  isSimulated: { type: Boolean, default: false, index: true },
  linkedBloodStockId: { type: Schema.Types.ObjectId, ref: 'BloodStock' },
  coordinates: {
    lat: { type: Number, default: 28.6139 },
    lng: { type: Number, default: 77.2090 }
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.model('BloodBank', BloodBankSchema);
