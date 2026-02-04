const express = require('express');
const Group = require('../models/Group');
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

const upload = multer({ storage });

// Create group
router.post('/', auth, upload.single('groupPicture'), async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const group = new Group({
      name,
      description,
      admin: req.user._id,
      members: [req.user._id],
      groupPicture: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await group.save();
    await group.populate('admin', 'name profilePicture');
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

module.exports = router;
