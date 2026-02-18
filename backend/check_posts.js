const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('Connecting to:', mongoURI);
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Define Post Schema (simplified)
        const postSchema = new mongoose.Schema({
            media: [{
                url: String,
                type: String
            }]
        }, { strict: false });

        const Post = mongoose.model('Post', postSchema);

        const posts = await Post.find({}).limit(10);
        console.log(`Found ${posts.length} posts.`);

        posts.forEach(post => {
            if (post.media && post.media.length > 0) {
                console.log('--- Post with Media ---');
                console.log('ID:', post._id);
                post.media.forEach(m => {
                    console.log(`Type: ${m.type}, URL: ${m.url}`);
                });
            }
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

connectDB();
