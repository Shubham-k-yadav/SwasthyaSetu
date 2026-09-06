import mongoose, { Schema } from 'mongoose';

const BedDetailSchema = new Schema({
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const BedUpgradeRequestSchema = new Schema({
  hospitalId: {
    type: Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  hospitalName: {
    type: String,
    required: true
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  requesterEmail: {
    type: String
  },
  currentBeds: {
    icu: { type: BedDetailSchema, required: true },
    general: { type: BedDetailSchema, required: true },
    ventilator: { type: BedDetailSchema, required: true }
  },
  requestedBeds: {
    icu: { type: BedDetailSchema, required: true },
    general: { type: BedDetailSchema, required: true },
    ventilator: { type: BedDetailSchema, required: true }
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  documentUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

BedUpgradeRequestSchema.index({ hospitalId: 1, status: 1 });

export default mongoose.model('BedUpgradeRequest', BedUpgradeRequestSchema);
