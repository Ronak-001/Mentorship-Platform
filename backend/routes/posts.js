const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Get all posts (feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name profilePicture role')
      .populate('likes', 'name')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get post by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name profilePicture role')
      .populate('likes', 'name')
      .populate('comments.user', 'name profilePicture');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create post
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { content, type, tags } = req.body;

    const media = req.files ? req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video'
    })) : [];

    const post = new Post({
      author: req.user._id,
      content,
      type: type || (media.length > 0 ? (media[0].type === 'image' ? 'image' : 'video') : 'text'),
      media,
      tags: tags ? tags.split(',') : []
    });

    await post.save();
    await post.populate('author', 'name profilePicture role');

    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Edit post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update content
    post.content = req.body.content || post.content;
    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    // Populate all fields before sending back
    await post.populate('author', 'name profilePicture role');
    await post.populate('likes', 'name');
    await post.populate('comments.user', 'name profilePicture');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const index = post.likes.indexOf(req.user._id);
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    // Populate author before sending back
    await post.populate('author', 'name profilePicture role');
    await post.populate('likes', 'name');
    await post.populate('comments.user', 'name profilePicture');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    await post.save();

    // Populate all fields before sending back
    await post.populate('author', 'name profilePicture role');
    await post.populate('likes', 'name');
    await post.populate('comments.user', 'name profilePicture');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
