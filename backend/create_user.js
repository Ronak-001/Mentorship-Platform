const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        const email = 'ronak.patel124421@gmail.com';
        const password = '123456';
        const name = 'Ronak Patel';

        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists, updating password...');
            user.password = password;
            await user.save();
            console.log('Password updated');
        } else {
            console.log('Creating new user...');
            user = new User({
                name,
                email,
                password,
                role: 'student'
            });
            await user.save();
            console.log('User created successfully');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
