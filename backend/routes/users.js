const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Get all users (for discovery)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('name email role profilePicture bio skills isAvailable')
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('connections', 'name profilePicture role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', auth, upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'coverPhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };
    delete updates.password;

    // Handle profilePicture upload
    if (req.files?.profilePicture) {
      updates.profilePicture = `/uploads/${req.files.profilePicture[0].filename}`;
    }

    // Handle coverPhoto upload
    if (req.files?.coverPhoto) {
      updates.coverPhoto = `/uploads/${req.files.coverPhoto[0].filename}`;
    }

    // Convert comma-separated skills string to array
    if (typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Parse experience, education, certificates (sent as JSON strings from form)
    ['experience', 'education', 'certificates'].forEach(field => {
      if (typeof updates[field] === 'string' && updates[field]) {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (e) {
          delete updates[field];
        }
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send connection request
router.post('/:id/connect', auth, async (req, res) => {
  try {
    const recipient = await User.findById(req.params.id);
    const sender = await User.findById(req.user._id);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (recipient._id.toString() === sender._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    // Check if already connected
    if (sender.connections.includes(recipient._id)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    // Initialize connectionRequests if it doesn't exist
    if (!recipient.connectionRequests) {
      recipient.connectionRequests = [];
    }

    // Check if request already exists
    const existingRequest = recipient.connectionRequests.find(
      req => req.sender.toString() === sender._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    // Create connection request
    recipient.connectionRequests.push({
      sender: sender._id,
      status: 'pending'
    });
    await recipient.save();

    res.json({ message: 'Connection request sent successfully' });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get connection requests
router.get('/connection-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Handle case where connectionRequests field doesn't exist yet
    if (!user.connectionRequests || user.connectionRequests.length === 0) {
      return res.json([]);
    }

    // Manually populate and filter out invalid requests
    const validRequests = [];
    for (const request of user.connectionRequests) {
      if (request.status === 'pending') {
        try {
          const sender = await User.findById(request.sender).select('name profilePicture role bio');
          if (sender) {
            validRequests.push({
              _id: request._id,
              sender: sender,
              status: request.status,
              createdAt: request.createdAt
            });
          }
        } catch (err) {
          // Skip invalid requests
          console.log('Skipping invalid request:', err.message);
        }
      }
    }

    res.json(validRequests);
  } catch (error) {
    console.error('Connection requests error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// Accept connection request
router.post('/connection-requests/:requestId/accept', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.connectionRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Update request status
    request.status = 'accepted';

    // Add to connections
    if (!user.connections.includes(request.sender)) {
      user.connections.push(request.sender);
    }
    await user.save();

    // Add to sender's connections
    const sender = await User.findById(request.sender);
    if (sender && !sender.connections.includes(user._id)) {
      sender.connections.push(user._id);
      await sender.save();
    }

    res.json({ message: 'Connection request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject connection request
router.post('/connection-requests/:requestId/reject', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.connectionRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = 'rejected';
    await user.save();

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users and groups
router.get('/search', auth, async (req, res) => {
  try {
    const { query, type } = req.query;

    if (!query) {
      return res.json({ users: [], groups: [] });
    }

    const searchRegex = new RegExp(query, 'i');
    let results = { users: [], groups: [] };

    if (!type || type === 'users') {
      const users = await User.find({
        _id: { $ne: req.user._id },
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { bio: searchRegex },
          { skills: searchRegex }
        ]
      })
        .select('name email role profilePicture bio skills')
        .limit(20);
      results.users = users;
    }

    if (!type || type === 'groups') {
      const groups = await Group.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
        .populate('admin', 'name')
        .limit(20);
      results.groups = groups;
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

// Request mentor
router.post('/:id/request-mentor', auth, async (req, res) => {
  try {
    const mentor = await User.findById(req.params.id);
    const student = await User.findById(req.user._id);

    if (!mentor || mentor.role !== 'mentor') {
      return res.status(400).json({ message: 'User is not a mentor' });
    }

    if (student.role !== 'student') {
      return res.status(400).json({ message: 'Only students can request mentors' });
    }

    const request = {
      student: student._id,
      message: req.body.message || '',
      status: 'pending'
    };

    mentor.mentorRequests.push(request);
    await mentor.save();

    res.json({ message: 'Mentor request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/reject mentor request
router.put('/mentor-requests/:requestId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const request = user.mentorRequests.id(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = req.body.status;
    await user.save();

    res.json({ message: `Request ${req.body.status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
