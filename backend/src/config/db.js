import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swasthya-setu';
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`✔ MongoDB Connected: ${conn.connection.host}`);
    global.isDemoMode = false;
  } catch (error) {
    global.isDemoMode = true;
    console.log('💡 Local MongoDB service is offline.');
    console.log('✨ Activated SwasthyaSetu Instant Demo Mode (Zero-delay Memory Store)');
  }
};

export default connectDB;
