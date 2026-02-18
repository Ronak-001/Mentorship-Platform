const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Define User Schema (simplified for query)
        const userSchema = new mongoose.Schema({
            email: String,
            password: String
        }, { strict: false });

        const User = mongoose.model('User', userSchema);

        const email = 'ronak.patel124421@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:', user);
        } else {
            console.log('User NOT found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

connectDB();
