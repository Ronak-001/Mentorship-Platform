const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Use strict: false to see ALL fields in the document, regardless of schema
        const postSchema = new mongoose.Schema({}, { strict: false });
        const Post = mongoose.model('Post', postSchema);

        const posts = await Post.find({}).limit(3);
        console.log(`Found ${posts.length} posts.`);

        posts.forEach((post, index) => {
            console.log(`\n--- Post ${index + 1} ---`);
            console.log(JSON.stringify(post.toObject(), null, 2));
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

connectDB();
