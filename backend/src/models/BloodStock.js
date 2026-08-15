import mongoose, { Schema } from 'mongoose';

const BloodStockSchema = new Schema({
  hospitalId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hospital', 
    required: true,
    index: true 
  },
  bloodGroup: { 
    type: String, 
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true 
  },
  unitsAvailable: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
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

BloodStockSchema.index({ hospitalId: 1, bloodGroup: 1 }, { unique: true });
BloodStockSchema.index({ bloodGroup: 1, unitsAvailable: 1 });

BloodStockSchema.pre('save', function() {
  this.isLow = this.unitsAvailable < this.minimumRequired;
  this.lastUpdated = new Date();
});

export default mongoose.model('BloodStock', BloodStockSchema);
