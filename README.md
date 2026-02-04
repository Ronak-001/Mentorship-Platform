# Mentor Connect - MERN Fullstack Application

A platform connecting mentors and students with video mentorship, chat, groups, and social features.

## Features

- 🔐 **Authentication** - Register/Login with JWT
- 👤 **Profiles** - LinkedIn-style profiles with experience, education, certificates
- 📱 **Social Feed** - Post text, images, videos, and blogs
- 💬 **Chat** - One-to-one messaging with Socket.io
- 👥 **Groups** - Create and join groups for discussions
- 📹 **Video Calls** - One-to-one and group video calls using WebRTC (free)
- 🔍 **Discover** - Find mentors and students
- 🎨 **Beautiful UI** - Frosted glass effect with purple/violet/dark blue theme

## Tech Stack

### Backend
- Node.js & Express
- MongoDB & Mongoose
- Socket.io for real-time features
- JWT for authentication
- Multer for file uploads
- WebRTC for video calls (free STUN servers)

### Frontend
- React
- React Router
- Axios
- Socket.io Client
- WebRTC API

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas free tier)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

4. Create `uploads` directory in backend:
```bash
mkdir uploads
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## MongoDB Setup

### Option 1: MongoDB Atlas (Free Tier - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (free tier)
4. Get your connection string
5. Add it to `backend/.env` as `MONGODB_URI`

### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use `mongodb://localhost:27017/mentorconnect` as `MONGODB_URI`

## Project Structure

```
mentor-connect/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # Uploaded files
│   └── server.js        # Express server
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Free Resources Used

- **MongoDB Atlas** - Free tier (512MB storage)
- **WebRTC** - Free STUN servers (Google)
- **Socket.io** - Free for real-time communication
- **Local file storage** - Free (uploads folder)

## Usage

1. **Register** - Create an account as student or mentor
2. **Complete Profile** - Add experience, education, certificates
3. **Discover** - Find mentors or students
4. **Connect** - Send connection requests
5. **Chat** - Message your connections
6. **Video Call** - Start one-to-one or group video calls
7. **Groups** - Create or join groups for discussions
8. **Post** - Share text, images, videos, or blogs

## Video Calling

Video calls use WebRTC with free STUN servers. For production, you may want to add TURN servers for better connectivity behind firewalls.

## File Uploads

Files are stored locally in the `backend/uploads` directory. For production, consider using:
- Cloudinary free tier (25GB)
- AWS S3 free tier
- Or other free storage solutions

## Notes

- All features use free resources
- Code is beginner-friendly with comments
- UI uses frosted glass effect with purple/violet/dark blue theme
- Responsive design for mobile and desktop

## License

MIT

## Contributing

Feel free to contribute and improve this project!
