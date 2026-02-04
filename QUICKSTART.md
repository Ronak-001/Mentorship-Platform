# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mentorconnect
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

Start backend:
```bash
npm start
```

### Step 2: Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
npm start
```

### Step 3: Access the App

Open your browser: `http://localhost:3000`

## 📝 First Steps

1. **Register** - Create an account (choose Student or Mentor)
2. **Login** - Use your credentials
3. **Complete Profile** - Add your information
4. **Discover** - Find mentors/students
5. **Connect** - Send connection requests
6. **Chat & Video** - Start conversations and video calls

## 🎨 Features Available

- ✅ User Authentication
- ✅ Profile Management (Experience, Education, Certificates)
- ✅ Social Feed (Text, Images, Videos, Blogs)
- ✅ One-to-One Chat
- ✅ Group Chat
- ✅ Video Calls (One-to-One & Group)
- ✅ Discover People
- ✅ Connect with Users

## 💡 Tips

- Use MongoDB Atlas free tier for cloud database
- Video calls use free WebRTC STUN servers
- All file uploads stored locally in `backend/uploads`
- Code is beginner-friendly with clear structure

## 🐛 Troubleshooting

**Backend won't start:**
- Check if MongoDB is running
- Verify `.env` file exists
- Check if port 5000 is available

**Frontend won't start:**
- Make sure backend is running first
- Check if port 3000 is available
- Clear browser cache

**Video calls not working:**
- Allow camera/microphone permissions
- Check browser console for errors
- Try different browser (Chrome/Firefox recommended)

## 📚 Need Help?

Check the main README.md for detailed documentation.
