// Quick script to test MongoDB connection
require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorconnect';
  
  console.log('Testing MongoDB connection...');
  console.log('Connection string:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide password
  
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    console.error('\n💡 Solutions:');
    console.error('1. If using local MongoDB: Make sure MongoDB service is running');
    console.error('2. If using MongoDB Atlas: Check your connection string in .env');
    console.error('3. Check your internet connection');
    console.error('4. See MONGODB_SETUP.md for detailed instructions');
    process.exit(1);
  }
};

testConnection();
