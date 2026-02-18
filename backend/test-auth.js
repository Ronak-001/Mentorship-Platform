const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testAuth() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test credentials
        const testEmail = 'test@example.com';
        const testPassword = 'test123';

        // Delete existing test user if exists
        await User.deleteOne({ email: testEmail });
        console.log('🧹 Cleaned up any existing test user');

        // Create new user
        const user = new User({
            name: 'Test User',
            email: testEmail,
            password: testPassword,
            role: 'student'
        });
        await user.save();
        console.log('✅ Created test user:', testEmail);

        // Test password comparison
        const foundUser = await User.findOne({ email: testEmail });
        const isMatch = await foundUser.comparePassword(testPassword);
        console.log('✅ Password comparison test:', isMatch ? 'PASSED ✓' : 'FAILED ✗');

        // Test wrong password
        const wrongMatch = await foundUser.comparePassword('wrongpassword');
        console.log('✅ Wrong password test:', !wrongMatch ? 'PASSED ✓' : 'FAILED ✗');

        console.log('\n📋 Test Summary:');
        console.log('   Email:', testEmail);
        console.log('   Password:', testPassword);
        console.log('   Use these credentials to log in at http://localhost:3001');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testAuth();
