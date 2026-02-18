const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const router = express.Router();

// Use memory storage instead of disk — files stay in buffer for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

/**
 * Determine the Cloudinary resource_type and our media type from mimetype.
 */
function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) {
    return { resourceType: 'image', mediaType: 'image' };
  }
  if (mimetype.startsWith('video/')) {
    return { resourceType: 'video', mediaType: 'video' };
  }
  // PDFs, docs, text files → Cloudinary "raw" resource type
  return { resourceType: 'raw', mediaType: 'blog' };
}

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

// Create post — uploads media to Cloudinary
router.post('/', auth, upload.array('media', 10), async (req, res) => {
  try {
    const { content, type, tags } = req.body;

    // Upload each file to Cloudinary
    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const { resourceType, mediaType } = getMediaType(file.mimetype);
        const result = await uploadToCloudinary(file.buffer, {
          resource_type: resourceType,
        });
        media.push({
          url: result.secure_url,
          public_id: result.public_id,
          type: mediaType,
        });
      }
    }

    let finalType = type || 'text';
    if (media.length > 0 && (!type || type === 'text')) {
      finalType = media[0].type;
    }

    // Ultra-safe tag parsing
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags;
      } else if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(t => t.trim()).filter(t => t !== '');
      }
    }

    const post = new Post({
      author: req.user._id,
      content: content || ' ',
      type: finalType,
      media,
      tags: parsedTags
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name profilePicture role');

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error('--- POST CREATION ERROR ---');
    console.error('Time:', new Date().toISOString());
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Edit post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    post.content = req.body.content || post.content;
    post.isEdited = true;
    post.editedAt = new Date();
    await post.save();
    await post.populate('author', 'name profilePicture role');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like/Unlike
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const index = post.likes.indexOf(req.user._id);
    if (index > -1) post.likes.splice(index, 1);
    else post.likes.push(req.user._id);
    await post.save();
    await post.populate('author', 'name profilePicture role');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.comments.push({ user: req.user._id, text: req.body.text });
    await post.save();
    await post.populate('author', 'name profilePicture role');
    await post.populate('comments.user', 'name profilePicture');
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete — also removes media from Cloudinary
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete media from Cloudinary
    if (post.media && post.media.length > 0) {
      for (const item of post.media) {
        if (item.public_id) {
          const resourceType = item.type === 'video' ? 'video' :
            item.type === 'blog' ? 'raw' : 'image';
          await deleteFromCloudinary(item.public_id, resourceType);
        }
      }
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
