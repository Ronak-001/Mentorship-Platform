# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Cloud - Recommended) ✅

### Step 1: Create Free Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for free account
3. Choose the **FREE** tier (M0 Sandbox)

### Step 2: Create Cluster
1. Click "Build a Database"
2. Select **FREE** (M0) tier
3. Choose a cloud provider and region (closest to you)
4. Click "Create"

### Step 3: Create Database User
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Set privileges to "Atlas admin" or "Read and write to any database"
6. Click "Add User"

### Step 4: Whitelist IP Address
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add your specific IP: `0.0.0.0/0`
4. Click "Confirm"

### Step 5: Get Connection String
1. Go to "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 6: Update .env File
Replace the connection string in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/mentorconnect?retryWrites=true&w=majority
```

**Important:** Replace:
- `YOUR_USERNAME` with your database username
- `YOUR_PASSWORD` with your database password
- `cluster0.xxxxx` with your actual cluster name

## Option 2: Local MongoDB

### Windows:
1. Download MongoDB from [mongodb.com/download](https://www.mongodb.com/try/download/community)
2. Install MongoDB Community Server
3. Start MongoDB service:
   - Open Services (Win+R, type `services.msc`)
   - Find "MongoDB" service
   - Right-click → Start

### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux:
```bash
# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### Verify MongoDB is Running:
```bash
# Check if MongoDB is running
mongosh
# or
mongo
```

If you see MongoDB shell, it's working!

### Update .env File:
```env
MONGODB_URI=mongodb://localhost:27017/mentorconnect
```

## Troubleshooting

### Error: "buffering timed out"
- **MongoDB not running** (local): Start MongoDB service
- **Wrong connection string**: Check your .env file
- **Firewall blocking**: Allow MongoDB port (27017) or use Atlas
- **Network issues**: Check internet connection

### Error: "authentication failed"
- Check username/password in connection string
- Verify database user exists in Atlas

### Error: "IP not whitelisted"
- Add your IP to MongoDB Atlas Network Access
- Or use `0.0.0.0/0` for development (not recommended for production)

## Quick Test

After setup, restart your backend server:
```bash
cd backend
npm start
```

You should see: `MongoDB Connected: ...`

If you see connection errors, check the troubleshooting section above.
