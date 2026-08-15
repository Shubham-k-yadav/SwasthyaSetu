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
    enum: ['pending', 'searching', 'assigned', 'in_transit', 'resolved', 'cancelled'],
    default: 'pending',
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
  notes: { type: String },
  estimatedArrival: { type: Number },
  resolvedAt: { type: Date }
}, {
  timestamps: true
});

EmergencyRequestSchema.index({ status: 1, createdAt: -1 });
EmergencyRequestSchema.index({ 'location.lat': 1, 'location.lng': 1 });

export default mongoose.model('EmergencyRequest', EmergencyRequestSchema);
