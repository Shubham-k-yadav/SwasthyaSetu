import mongoose, { Schema } from 'mongoose';

const BedCountSchema = new Schema({
  total: { type: Number, required: true, default: 0 },
  available: { type: Number, required: true, default: 0 }
}, { _id: false });

const CoordinatesSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
}, { _id: false });

const HospitalSchema = new Schema({
  name: { type: String, required: true, index: true },
  address: { type: String, required: true },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true, index: true },
  coordinates: { type: CoordinatesSchema, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  beds: {
    icu: { type: BedCountSchema, required: true },
    general: { type: BedCountSchema, required: true },
    ventilator: { type: BedCountSchema, required: true }
  },
  specialties: [{ type: String }],
  emergencyServices: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false, index: true },
  registrationCertificate: { type: String, default: '' },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending',
    index: true 
  },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  lastUpdated: { type: Date, default: Date.now },
  blockchainHash: { type: String },
  transactionHash: { type: String }
}, {
  timestamps: true
});

HospitalSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
HospitalSchema.index({ 'beds.icu.available': 1 });
HospitalSchema.index({ 'beds.general.available': 1 });
HospitalSchema.index({ 'beds.ventilator.available': 1 });

export default mongoose.model('Hospital', HospitalSchema);
