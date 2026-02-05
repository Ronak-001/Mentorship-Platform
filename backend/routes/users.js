const express = require('express');
const User = require('../models/User');
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

// Connect with user
router.post('/:id/connect', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    if (!currentUser.connections.includes(user._id)) {
      currentUser.connections.push(user._id);
      await currentUser.save();
    }

    if (!user.connections.includes(currentUser._id)) {
      user.connections.push(currentUser._id);
      await user.save();
    }

    res.json({ message: 'Connected successfully' });
  } catch (error) {
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
