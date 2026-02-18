const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// SURVIVAL PING - TO PROVE SERVER RESTARTED
try {
  fs.writeFileSync(path.join(__dirname, 'server_alive.txt'), 'Server started at ' + new Date().toISOString());
} catch (e) {
  console.error('Survival ping failed:', e);
}
require('dotenv').config();

const app = express();
const server = http.createServer(app);
// Normalize CLIENT_URL by removing trailing slash
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
const allowedOrigin = clientUrl.replace(/\/$/, ''); // Remove trailing slash if present
const isProd = process.env.NODE_ENV === 'production';
const corsOptions = {
  origin: isProd ? allowedOrigin : true,
  credentials: true,
};

app.set('trust proxy', 1);

const io = socketIo(server, {
  cors: {
    origin: isProd ? allowedOrigin : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limit for API
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection with better timeout handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorconnect';

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('\n⚠️  Please check:');
    console.error('1. Is MongoDB running? (if using local MongoDB)');
    console.error('2. Is your MONGODB_URI correct in .env file?');
    console.error('3. If using MongoDB Atlas, check your connection string');
    console.error('4. Check your internet connection');
    process.exit(1);
  }
};

connectDB();

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'up' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/groups', require('./routes/groups'));

// Serve frontend build (SPA) in production only (after `frontend` is built)
const frontendPath = path.join(__dirname, '../frontend/build');
if (isProd && fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handler (keep last)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const errorData = `
--- GLOBAL ERROR HANDLER ---
Time: ${new Date().toISOString()}
Method: ${req.method}
URL: ${req.originalUrl}
Body Keys: ${req.body ? Object.keys(req.body) : 'None'}
Error Message: ${err.message}
Error Stack: ${err.stack}
----------------------------
`;
  console.error(errorData);

  // Write to a file so I can read it even if the user can't see the terminal
  try {
    fs.appendFileSync(path.join(__dirname, 'error.log'), errorData);
  } catch (e) {
    console.error('Failed to write to error.log:', e);
  }

  res.status(500).json({
    message: 'Internal server error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Socket.io for real-time chat and video calls
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
  });

  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data.offer);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data.answer);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data.candidate);
  });

  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
  });

  socket.on('send-message', (data) => {
    socket.to(data.chatId).emit('receive-message', data);
  });

  // Connection request events
  socket.on('connection-request-sent', (data) => {
    socket.to(data.recipientId).emit('connection-request-received', data);
  });

  socket.on('connection-request-accepted', (data) => {
    socket.to(data.senderId).emit('connection-accepted', data);
  });

  socket.on('connection-request-rejected', (data) => {
    socket.to(data.senderId).emit('connection-rejected', data);
  });

  // Video call request events
  socket.on('video-call-request', (data) => {
    socket.to(data.recipientId).emit('incoming-video-call', data);
  });

  socket.on('video-call-accepted', (data) => {
    socket.to(data.callerId).emit('video-call-accepted', data);
  });

  socket.on('video-call-rejected', (data) => {
    socket.to(data.callerId).emit('video-call-rejected', data);
  });

  socket.on('video-call-cancelled', (data) => {
    socket.to(data.recipientId).emit('video-call-cancelled', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
