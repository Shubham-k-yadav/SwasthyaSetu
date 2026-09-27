import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

const DonationRecordSchema = new Schema({
  bloodBankId: { type: Schema.Types.ObjectId, ref: 'BloodBank' },
  bloodBankName: { type: String, default: 'SwasthyaSetu Blood Bank' },
  donationDate: { type: Date, default: Date.now },
  unitsDonated: { type: Number, default: 1, min: 1 },
  bloodGroup: { type: String, required: true },
  bagId: { type: String },
  hemoglobin: { type: Number },
  bloodPressure: { type: String },
  status: { type: String, enum: ['approved', 'deferred'], default: 'approved' },
  deferralReason: { type: String },
  certificateId: { type: String },
  recordedBy: { type: String, default: 'Blood Bank Administrator' }
}, { _id: true, timestamps: true });

const DonorSchema = new Schema({
  donorCardId: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true 
  },
  name: { type: String, required: true, index: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    index: true 
  },
  city: { type: String, required: true, index: true },
  state: { type: String, required: true },
  address: { type: String },
  isAvailable: { type: Boolean, default: true },
  lastDonation: { type: Date },
  nextEligibleDate: { type: Date },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  totalDonations: { type: Number, default: 0 },
  healthStatus: { 
    type: String, 
    enum: ['eligible', 'temporary_deferral', 'permanent_deferral'],
    default: 'eligible'
  },
  age: { type: Number, required: true, min: 18, max: 65 },
  weight: { type: Number, required: true, min: 50 },
  donationHistory: [DonationRecordSchema]
}, {
  timestamps: true
});

DonorSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

// Generate unique DONOR-XXXXXX card ID if not already present
DonorSchema.pre('save', function(next) {
  if (!this.donorCardId) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.donorCardId = `DONOR-${randomHex}`;
  }
  next();
});

DonorSchema.methods.canDonate = function() {
  if (this.healthStatus !== 'eligible' || !this.isAvailable) {
    return false;
  }
  
  if (this.nextEligibleDate && new Date(this.nextEligibleDate) > new Date()) {
    return false;
  }

  if (this.lastDonation) {
    const daysSinceLastDonation = Math.floor(
      (Date.now() - new Date(this.lastDonation).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastDonation >= 90;
  }
  
  return true;
};

export default mongoose.model('Donor', DonorSchema);
