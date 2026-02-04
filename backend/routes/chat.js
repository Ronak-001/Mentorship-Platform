const express = require('express');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const router = express.Router();

// Get or create chat
router.post('/', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'name profilePicture');

    if (!chat) {
      chat = new Chat({
        participants: [req.user._id, userId]
      });
      await chat.save();
      await chat.populate('participants', 'name profilePicture');
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all chats for user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name profilePicture')
      .sort({ lastMessageAt: -1 });
    
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chat by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name profilePicture')
      .populate('messages.sender', 'name profilePicture');
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = {
      sender: req.user._id,
      text: req.body.text
    };

    chat.messages.push(message);
    chat.lastMessage = req.body.text;
    chat.lastMessageAt = new Date();
    
    await chat.save();
    await chat.populate('messages.sender', 'name profilePicture');
    
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
