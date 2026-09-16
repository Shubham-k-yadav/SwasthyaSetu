import mongoose, { Schema } from 'mongoose';

const BedReservationSchema = new Schema({
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  bedType: {
    type: String,
    enum: ['icu', 'general', 'ventilator'],
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'male', 'female', 'other', ''],
    default: ''
  },
  emergencyNotes: {
    type: String,
    trim: true,
    default: ''
  },
  chiefComplaint: {
    type: String,
    trim: true,
    default: ''
  },
  diagnosis: {
    type: String,
    trim: true,
    default: ''
  },
  injuryDetails: {
    type: String,
    trim: true,
    default: ''
  },
  triagePriority: {
    type: String,
    enum: ['critical', 'urgent', 'stable', 'normal', ''],
    default: 'urgent'
  },
  assignedDoctor: {
    name: { type: String, trim: true, default: '' },
    specialty: { type: String, trim: true, default: '' },
    assignedAt: { type: Date, default: null }
  },
  vitals: {
    bp: { type: String, trim: true, default: '' },
    pulse: { type: String, trim: true, default: '' },
    spO2: { type: String, trim: true, default: '' },
    temperature: { type: String, trim: true, default: '' },
    recordedAt: { type: Date, default: null }
  },
  clinicalNotes: {
    type: String,
    trim: true,
    default: ''
  },
  reservationCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'released', 'expired', 'discharged'],
    default: 'reserved',
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

BedReservationSchema.index({ hospitalId: 1, status: 1 });

export default mongoose.model('BedReservation', BedReservationSchema);
