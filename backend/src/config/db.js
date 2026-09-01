import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthya_setu';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`✔ MongoDB Connected: ${conn.connection.host}`);
    global.isDemoMode = false;
  } catch (error) {
    global.isDemoMode = true;
    console.log(`💡 MongoDB connection failed: ${error.message}`);
    console.log('✨ Activated SwasthyaSetu Instant Demo Mode (Zero-delay Memory Store)');
  }
};

export default connectDB;
