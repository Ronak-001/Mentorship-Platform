const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Use strict: false to see ALL fields
        const postSchema = new mongoose.Schema({}, { strict: false });
        const Post = mongoose.model('Post', postSchema);

        // Find posts that are NOT text type
        const posts = await Post.find({
            type: { $in: ['video', 'image', 'document'] }
        }).limit(10);

        console.log(`Found ${posts.length} media posts.`);

        let output = '';
        posts.forEach((post, index) => {
            output += `\n--- Media Post ${index + 1} ---\n`;
            output += JSON.stringify(post.toObject(), null, 2);
        });

        fs.writeFileSync('posts_dump.txt', output);
        console.log('Dumped posts to posts_dump.txt');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

connectDB();
