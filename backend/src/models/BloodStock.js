import mongoose, { Schema } from 'mongoose';

const BloodStockSchema = new Schema({
  hospitalId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: false,
    index: true 
  },
  bloodBankId: {
    type: Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: false,
    index: true
  },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: false 
  },
  unitsAvailable: { 
    type: Number, 
    required: false, 
    default: 0,
    min: 0 
  },
  bloodGroups: {
    type: Schema.Types.Mixed,
    default: {}
  },
  city: {
    type: String,
    index: true
  },
  state: {
    type: String,
    default: 'India',
    index: true
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  },
  minimumRequired: {
    type: Number,
    default: 5
  },
  isLow: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

BloodStockSchema.index({ hospitalId: 1, bloodGroup: 1 });

BloodStockSchema.pre('save', function() {
  this.lastUpdated = new Date();
});

export default mongoose.model('BloodStock', BloodStockSchema);
