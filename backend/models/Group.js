const mongoose = require('mongoose');

const channelMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const channelSchema = new mongoose.Schema({
  name: { type: String, required: true },                          // "Community Chat" / "Announcements"
  type: { type: String, enum: ['community', 'announcements'], required: true },
  messages: [channelMessageSchema]
});

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  channels: [channelSchema],
  // Legacy flat messages (kept for non-program groups)
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  groupPicture: {
    type: String,
    default: ''
  },
  // Program group fields
  isProgramGroup: { type: Boolean, default: false },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
