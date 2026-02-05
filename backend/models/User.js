const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'mentor'],
    default: 'student'
  },
  bio: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  experience: [{
    title: String,
    company: String,
    startDate: Date,
    endDate: Date,
    description: String,
    current: Boolean
  }],
  education: [{
    school: String,
    degree: String,
    field: String,
    startDate: Date,
    endDate: Date,
    description: String
  }],
  certificates: [{
    name: String,
    issuer: String,
    issueDate: Date,
    credentialUrl: String,
    image: String
  }],
  skills: [{
    type: String
  }],
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentorRequests: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  hourlyRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
