const express = require('express');
const Group = require('../models/Group');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const { uploadToCloudinary } = require('../config/cloudinary');
const router = express.Router();

// Use memory storage — files stay in buffer for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper: check if a user is an admin of the group
const isGroupAdmin = (group, userId) => {
  const uid = userId.toString();
  return group.admin.toString() === uid ||
    (group.admins || []).some(a => a.toString() === uid);
};

// Create group (photo → Cloudinary)
router.post('/', auth, upload.single('groupPicture'), async (req, res) => {
  try {
    const { name, description } = req.body;

    let groupPictureUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'image',
        folder: 'mentorship-platform/groups',
      });
      groupPictureUrl = result.secure_url;
    }

    const group = new Group({
      name,
      description,
      admin: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      groupPicture: groupPictureUrl
    });

    await group.save();
    await group.populate('admin', 'name profilePicture');
    await group.populate('admins', 'name profilePicture');
    await group.populate('members', 'name profilePicture');

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all groups user is part of
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id
    })
      .populate('admin', 'name profilePicture')
      .populate('admins', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('admin', 'name profilePicture')
      .populate('admins', 'name profilePicture')
      .populate('members', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update group settings (admin only — name, description, photo)
router.put('/:id', auth, upload.single('groupPicture'), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can edit group settings' });
    }

    const { name, description } = req.body;
    if (name) group.name = name;
    if (typeof description !== 'undefined') group.description = description;

    // Upload new photo to Cloudinary if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        resource_type: 'image',
        folder: 'mentorship-platform/groups',
      });
      group.groupPicture = result.secure_url;
    }

    await group.save();
    await group.populate('admin', 'name profilePicture');
    await group.populate('admins', 'name profilePicture');
    await group.populate('members', 'name profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.includes(req.user._id)) {
      group.members.push(req.user._id);
      await group.save();
    }

    await group.populate('members', 'name profilePicture');
    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    group.members = group.members.filter(
      m => m.toString() !== req.user._id.toString()
    );

    // Also remove from admins if leaving
    group.admins = (group.admins || []).filter(
      a => a.toString() !== req.user._id.toString()
    );

    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message to group
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!group.members.some(m => m.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = {
      sender: req.user._id,
      text: req.body.text
    };

    group.messages.push(message);
    await group.save();
    await group.populate('messages.sender', 'name profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to group (admin only)
router.post('/:id/add-member', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.members.push(userId);
    await group.save();
    await group.populate('admin', 'name profilePicture');
    await group.populate('admins', 'name profilePicture');
    await group.populate('members', 'name profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Make a member an admin (admin only)
router.post('/:id/make-admin', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    if (!isGroupAdmin(group, req.user._id)) {
      return res.status(403).json({ message: 'Only admins can promote members' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!group.members.some(m => m.toString() === userId)) {
      return res.status(400).json({ message: 'User must be a member of the group' });
    }

    if ((group.admins || []).some(a => a.toString() === userId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    if (!group.admins) group.admins = [];
    group.admins.push(userId);
    await group.save();

    await group.populate('admin', 'name profilePicture');
    await group.populate('admins', 'name profilePicture');
    await group.populate('members', 'name profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove admin status from a member (creator only)
router.post('/:id/remove-admin', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only the original creator can remove admin status
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the group creator can remove admin status' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Cannot remove creator's own admin status
    if (userId === group.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove creator admin status' });
    }

    // Check if user is actually an admin
    if (!(group.admins || []).some(a => a.toString() === userId)) {
      return res.status(400).json({ message: 'User is not an admin' });
    }

    group.admins = group.admins.filter(a => a.toString() !== userId);
    await group.save();

    await group.populate('admin', 'name profilePicture');
    await group.populate('admins', 'name profilePicture');
    await group.populate('members', 'name profilePicture');

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
