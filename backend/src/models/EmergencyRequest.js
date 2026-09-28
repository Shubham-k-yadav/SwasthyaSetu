import mongoose, { Schema } from 'mongoose';

const EmergencyRequestSchema = new Schema({
  patientName: { type: String },
  contactPhone: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  emergencyType: { 
    type: String, 
    enum: ['trauma', 'cardiac', 'stroke', 'accident', 'respiratory', 'other'],
    required: true 
  },
  bedType: { 
    type: String, 
    enum: ['icu', 'general', 'ventilator'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'searching', 'assigned', 'dispatched', 'in_transit', 'admitted', 'resolved', 'cancelled'],
    default: 'searching',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'high' 
  },
  assignedHospital: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hospital' 
  },
  recommendedHospitals: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Hospital' 
  }],
  assignedAmbulance: {
    type: Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  ambulanceDetails: {
    vehicleNumber: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    currentLat: { type: Number },
    currentLng: { type: Number },
    equipmentLevel: { type: String }
  },
  dispatchedAt: { type: Date },
  sosTriggerType: {
    type: String,
    enum: ['1_click_sos', 'manual_form'],
    default: '1_click_sos'
  },
  notes: { type: String },
  estimatedArrival: { type: Number },
  resolvedAt: { type: Date }
}, {
  timestamps: true
});

EmergencyRequestSchema.index({ status: 1, createdAt: -1 });
EmergencyRequestSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('EmergencyRequest', EmergencyRequestSchema);
