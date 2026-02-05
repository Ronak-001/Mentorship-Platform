# Mentor Connect – Setup Guide

## Does this project use a virtual environment?

**No.** This is a **Node.js + React** (JavaScript) full-stack app, not Python.

- **No Python** – There are no `.py` files. Nothing uses a Python venv/virtualenv.
- **“Environment” here** means:
  1. **Backend**: A `.env` file (for MongoDB URI, JWT secret, etc.) and `node_modules/` (from `npm install`).
  2. **Frontend**: Optional `.env` and `node_modules/` (from `npm install`).

So you do **not** need to create or activate any virtual environment. You only need Node.js, npm, and the steps below.

---

## What you need installed

- **Node.js** (v14 or higher) – includes **npm**
- **MongoDB Atlas** – free cloud database (you’ll paste the connection string into `.env`)

---

## Step-by-step: Run the app

### Step 1: Add your MongoDB Atlas string

1. Open: `Mentorship-Platform/backend/.env`
2. Find the line: `MONGODB_URI=...`
3. Replace the value with your **full MongoDB Atlas connection string** (the one you will provide).
4. Save the file.

Example format:
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/mentorconnect?retryWrites=true&w=majority
```

---

### Step 2: Backend – install and run

Open a terminal (e.g. Git Bash) and run:

```bash
cd "Mentorship-Platform/backend"
npm install
npm start
```

You should see something like: `MongoDB Connected` and `Server running on port 5000`.  
**Leave this terminal open.**

---

### Step 3: Frontend – install and run

Open a **second** terminal and run:

```bash
cd "Mentorship-Platform/frontend"
npm install
npm start
```

The first `npm install` may take a few minutes. When it finishes, `npm start` will open the app in your browser at **http://localhost:3000**.

---

### Step 4: Use the app

- **App (frontend):** http://localhost:3000  
- **API (backend):** http://localhost:5000  

Register a user, then log in and use the platform.

---

## If something fails

- **“MongoDB connection error”**  
  - Check that you pasted the **full** Atlas string in `backend/.env` as `MONGODB_URI`.  
  - In Atlas: Network Access → allow your IP (or “Allow access from anywhere” for testing).

- **“Port 5000 already in use”**  
  - Another app is using port 5000. Close it or change `PORT` in `backend/.env` (e.g. `PORT=5001`).

- **Frontend can’t reach backend**  
  - Ensure the backend is running (`npm start` in `backend/`) and that `backend/.env` has no typos.

---

## Summary

| Question | Answer |
|----------|--------|
| Is there a virtual environment? | No. This is Node.js/React; no Python venv. |
| Do I need to create one? | No. |
| What do I need to do? | 1) Put your Atlas string in `backend/.env` → 2) `npm install` and `npm start` in **backend** → 3) Same in **frontend** in a second terminal. |

Once you add your MongoDB Atlas string to `backend/.env`, you can follow Steps 2–4 above to run the full-stack app.
