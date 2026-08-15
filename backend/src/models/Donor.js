import mongoose, { Schema } from 'mongoose';

const DonorSchema = new Schema({
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
  weight: { type: Number, required: true, min: 50 }
}, {
  timestamps: true
});

DonorSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

DonorSchema.methods.canDonate = function() {
  if (this.healthStatus !== 'eligible' || !this.isAvailable) {
    return false;
  }
  
  if (this.lastDonation) {
    const daysSinceLastDonation = Math.floor(
      (Date.now() - new Date(this.lastDonation).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastDonation >= 56;
  }
  
  return true;
};

export default mongoose.model('Donor', DonorSchema);
