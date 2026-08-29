import mongoose, { Schema } from 'mongoose';

const AmbulanceSchema = new Schema({
  vehicleNumber: { type: String, required: true, unique: true, index: true },
  hospitalId: { type: Schema.Types.ObjectId, ref: 'Hospital' },
  hospitalName: { type: String },
  driverName: { type: String, required: true },
  driverPhone: { type: String, required: true },
  currentLat: { type: Number, required: true, default: 28.6139 },
  currentLng: { type: Number, required: true, default: 77.2090 },
  status: { 
    type: String, 
    enum: ['available', 'en_route', 'busy', 'offline'], 
    default: 'available',
    index: true 
  },
  equipmentLevel: {
    type: String,
    enum: ['Basic Life Support (BLS)', 'Advanced Life Support (ALS)', 'Patient Transport'],
    default: 'Advanced Life Support (ALS)'
  },
  driverToken: { type: String, index: true },
  isVerified: { type: Boolean, default: false, index: true },
  isSimulated: { type: Boolean, default: false, index: true },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

AmbulanceSchema.index({ currentLat: 1, currentLng: 1 });

export default mongoose.model('Ambulance', AmbulanceSchema);
