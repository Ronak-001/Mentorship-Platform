const express = require('express');
const User = require('../models/User');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const router = express.Router();

// Use memory storage — files stay in buffer for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Get my received connection requests (populated with sender info)
// IMPORTANT: This MUST be defined before GET /:id to avoid Express matching 'connection-requests' as :id
router.get('/connection-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Populate manually to handle any corrupt IDs gracefully
    const populatedRequests = [];
    for (const reqId of (user.receivedRequests || [])) {
      try {
        const sender = await User.findById(reqId).select('name profilePicture role bio');
        if (sender) populatedRequests.push(sender);
      } catch (e) {
        // Skip invalid IDs
      }
    }

    res.json(populatedRequests);
  } catch (error) {
    console.error('Connection requests error:', error.message);
    res.status(500).json({ message: 'Server error fetching connection requests' });
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

// Upload profile photo instantly (standalone, no full form save needed)
router.patch('/profile-photo', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'image',
      folder: 'mentorship-platform/profiles',
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profilePicture: result.secure_url } },
      { new: true }
    ).select('-password');
    console.log('Profile photo uploaded:', result.secure_url);
    res.json(user);
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Upload cover photo instantly
router.patch('/cover-photo', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const result = await uploadToCloudinary(req.file.buffer, {
      resource_type: 'image',
      folder: 'mentorship-platform/covers',
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { coverPhoto: result.secure_url } },
      { new: true }
    ).select('-password');
    console.log('Cover photo uploaded:', result.secure_url);
    res.json(user);
  } catch (error) {
    console.error('Error uploading cover photo:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update user profile — uploads images to Cloudinary
router.put('/:id', auth, upload.any(), async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = { ...req.body };
    delete updates.password;

    console.log('Update profile request received for user:', req.params.id);
    if (req.files) {
      console.log('Files received:', req.files.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype
      })));
    }

    // Handle profilePicture upload → Cloudinary
    const profilePicFile = req.files?.find(f => f.fieldname === 'profilePicture');
    if (profilePicFile) {
      const result = await uploadToCloudinary(profilePicFile.buffer, {
        resource_type: 'image',
        folder: 'mentorship-platform/profiles',
      });
      updates.profilePicture = result.secure_url;
      console.log('Profile picture uploaded to Cloudinary:', result.secure_url);
    }

    // Handle coverPhoto upload → Cloudinary
    const coverFile = req.files?.find(f => f.fieldname === 'coverPhoto');
    if (coverFile) {
      const result = await uploadToCloudinary(coverFile.buffer, {
        resource_type: 'image',
        folder: 'mentorship-platform/covers',
      });
      updates.coverPhoto = result.secure_url;
      console.log('Cover photo uploaded to Cloudinary:', result.secure_url);
    }

    // Convert comma-separated skills string to array
    if (typeof updates.skills === 'string') {
      updates.skills = updates.skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    // Parse experience, education (sent as JSON strings from form)
    ['experience', 'education'].forEach(field => {
      if (typeof updates[field] === 'string' && updates[field]) {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch (e) {
          delete updates[field];
        }
      }
    });

    // Parse certificatesData
    if (typeof updates.certificatesData === 'string' && updates.certificatesData) {
      try {
        updates.certificates = JSON.parse(updates.certificatesData);
      } catch (e) {
        updates.certificates = [];
      }
      delete updates.certificatesData;
    }

    // Handle certificate file uploads → Cloudinary
    if (req.files && Array.isArray(req.files)) {
      if (!updates.certificates) {
        updates.certificates = [];
      }

      for (let idx = 0; idx < updates.certificates.length; idx++) {
        const certFile = req.files.find(f => f.fieldname === `certificate_file_${idx}`);
        if (certFile) {
          const resourceType = certFile.mimetype.includes('pdf') ? 'raw' : 'image';
          const result = await uploadToCloudinary(certFile.buffer, {
            resource_type: resourceType,
            folder: 'mentorship-platform/certificates',
          });
          updates.certificates[idx].image = result.secure_url;
          console.log(`Certificate ${idx} uploaded to Cloudinary:`, result.secure_url);
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
});




// Send connection request
router.post('/:id/connect', auth, async (req, res) => {
  try {
    const recipientId = req.params.id;
    const senderId = req.user._id.toString();

    if (recipientId === senderId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId)
    ]);

    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Already connected? Return current status (not an error)
    if (sender.connections.map(c => c.toString()).includes(recipientId)) {
      return res.json({ message: 'Already connected', status: 'CONNECTED' });
    }

    // Already sent? Return current status (not an error)
    if (sender.sentRequests.map(c => c.toString()).includes(recipientId)) {
      return res.json({ message: 'Connection request already sent', status: 'REQUEST_SENT' });
    }

    // Did THEY send US a request? If so, auto-accept
    if (sender.receivedRequests.map(c => c.toString()).includes(recipientId)) {
      // Auto-accept: both sides become connected
      sender.receivedRequests = sender.receivedRequests.filter(id => id.toString() !== recipientId);
      recipient.sentRequests = recipient.sentRequests.filter(id => id.toString() !== senderId);
      if (!sender.connections.map(c => c.toString()).includes(recipientId)) {
        sender.connections.push(recipientId);
      }
      if (!recipient.connections.map(c => c.toString()).includes(senderId)) {
        recipient.connections.push(senderId);
      }
      await Promise.all([sender.save(), recipient.save()]);
      return res.json({ message: 'Connected!', status: 'CONNECTED' });
    }

    // Send new request
    sender.sentRequests.push(recipientId);
    recipient.receivedRequests.push(senderId);
    await Promise.all([sender.save(), recipient.save()]);

    res.json({ message: 'Connection request sent successfully', status: 'REQUEST_SENT' });
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get connection status with a specific user
router.get('/:id/connection-status', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const me = await User.findById(req.user._id);

    if (me.connections.map(c => c.toString()).includes(targetId)) {
      return res.json({ status: 'CONNECTED' });
    }
    if (me.sentRequests.map(c => c.toString()).includes(targetId)) {
      return res.json({ status: 'REQUEST_SENT' });
    }
    if (me.receivedRequests.map(c => c.toString()).includes(targetId)) {
      return res.json({ status: 'REQUEST_RECEIVED' });
    }
    res.json({ status: 'NOT_CONNECTED' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Accept connection request
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const senderId = req.params.id;
    const myId = req.user._id.toString();

    const [me, sender] = await Promise.all([
      User.findById(myId),
      User.findById(senderId)
    ]);

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify the request exists
    if (!me.receivedRequests.map(c => c.toString()).includes(senderId)) {
      return res.status(400).json({ message: 'No pending request from this user' });
    }

    // Remove from request arrays
    me.receivedRequests = me.receivedRequests.filter(id => id.toString() !== senderId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== myId);

    // Add to connections
    if (!me.connections.map(c => c.toString()).includes(senderId)) {
      me.connections.push(senderId);
    }
    if (!sender.connections.map(c => c.toString()).includes(myId)) {
      sender.connections.push(myId);
    }

    await Promise.all([me.save(), sender.save()]);
    res.json({ message: 'Connection request accepted', status: 'CONNECTED' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Decline connection request
router.post('/:id/decline', auth, async (req, res) => {
  try {
    const senderId = req.params.id;
    const myId = req.user._id.toString();

    const [me, sender] = await Promise.all([
      User.findById(myId),
      User.findById(senderId)
    ]);

    if (!sender) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from both sides
    me.receivedRequests = me.receivedRequests.filter(id => id.toString() !== senderId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== myId);

    await Promise.all([me.save(), sender.save()]);
    res.json({ message: 'Connection request declined', status: 'DECLINED' });
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
