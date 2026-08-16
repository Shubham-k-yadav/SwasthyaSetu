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
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  reservationCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['reserved', 'confirmed', 'released', 'expired'],
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
