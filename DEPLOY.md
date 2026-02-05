# Deploy Mentor Connect

To let your team access the app, you need to deploy both the **frontend** (React) and **backend** (Node/Express). Vercel is used for the frontend; the backend is deployed elsewhere (e.g. Render) because it uses WebSockets (Socket.io) and a long-running server.

---

## Overview

| Part      | Where to deploy | Why                          |
|-----------|-----------------|------------------------------|
| Frontend | **Vercel**      | Great for React, free tier   |
| Backend  | **Render** (or Railway) | Free tier, supports Node + WebSockets |
| Database | **MongoDB Atlas** | You already use this        |

---

## Step 1: Deploy backend (Render)

1. Go to [render.com](https://render.com) and sign up (free).
2. **New → Web Service**.
3. Connect your Git repo (e.g. GitHub).  
   - If the repo is the whole project, set **Root Directory** to `Mentorship-Platform/backend` (or just `backend` if the repo root is the project root).
4. Configure:
   - **Name:** `mentor-connect-api` (or any name).
   - **Runtime:** Node.
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free.
5. **Environment** (Environment Variables):
   - `MONGODB_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = a long random string (e.g. from [randomkeygen](https://randomkeygen.com))
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = leave empty for now; set it **after** you deploy the frontend (e.g. `https://your-app.vercel.app`)
6. **Create Web Service**. Wait until the service is live.
7. Copy the service URL (e.g. `https://mentor-connect-api.onrender.com`).
8. In Render, open your service → **Environment** → add or update:
   - `CLIENT_URL` = `https://your-frontend.vercel.app` (you’ll set this after Step 2).

**Note:** On the free tier, the backend may sleep after inactivity; the first request after sleep can be slow.

---

## Step 2: Deploy frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign up (e.g. with GitHub).
2. **Add New → Project** and import your Git repository.
3. Configure:
   - **Root Directory:** click **Edit** and set to `frontend` (or `Mentorship-Platform/frontend` if your repo root is above that).
   - **Framework Preset:** Create React App (or Vite if you ever switch).
   - **Build Command:** `npm run build` (default).
   - **Output Directory:** `build` (default for CRA).
4. **Environment Variables** (add these before deploying):
   - `REACT_APP_API_URL` = `https://YOUR-RENDER-URL.onrender.com/api`  
     (e.g. `https://mentor-connect-api.onrender.com/api`)
   - `REACT_APP_SOCKET_URL` = `https://YOUR-RENDER-URL.onrender.com`  
     (e.g. `https://mentor-connect-api.onrender.com`)
   Replace `YOUR-RENDER-URL` with the URL from Step 1.
5. Click **Deploy**. Wait for the build to finish.
6. Copy your frontend URL (e.g. `https://your-project.vercel.app`).
7. Go back to **Render → your backend service → Environment** and set:
   - `CLIENT_URL` = `https://your-project.vercel.app`  
   (and add your Vercel URL to CORS if you use an allowlist later).

The `frontend/vercel.json` already set up rewrites so React Router works on Vercel.

---

## Step 3: MongoDB Atlas (if not already done)

1. In [MongoDB Atlas](https://cloud.mongodb.com) → **Network Access** → allow `0.0.0.0/0` (or restrict to Render/Vercel IPs if you prefer).
2. Use the same Atlas connection string in Render as `MONGODB_URI`.

---

## Step 4: Share with your team

- **App URL:** `https://your-project.vercel.app`  
- **Backend API:** `https://your-render-url.onrender.com` (only needed for debugging).

Team members can open the Vercel URL, register, and use the app. Data is stored in your MongoDB Atlas and served via the Render backend.

---

## Checklist

- [ ] Backend deployed on Render with `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, and later `CLIENT_URL`.
- [ ] Frontend deployed on Vercel with **Root Directory** = `frontend` and env vars `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL`.
- [ ] `CLIENT_URL` on Render set to your Vercel URL.
- [ ] MongoDB Atlas allows connections from the internet (e.g. `0.0.0.0/0` for simplicity).

---

## Optional: Backend on Railway

Instead of Render you can use [Railway](https://railway.app):

1. New project → Deploy from GitHub → select repo, set root to `backend`.
2. Add env vars: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `CLIENT_URL` (your Vercel URL).
3. Use the generated public URL as `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` (with `/api` only in `REACT_APP_API_URL`).

Same idea: backend URL in frontend env; frontend URL in backend `CLIENT_URL`.
