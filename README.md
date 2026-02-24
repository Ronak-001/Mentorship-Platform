# Mentor Connect

A full-stack mentorship platform connecting mentors and students.

**Tech Stack:** React · Node.js/Express · MongoDB Atlas · Socket.io · Cloudinary

---

## Prerequisites

Make sure you have these installed (see `requirements.txt`):

- **Node.js** >= 18.x → [Download](https://nodejs.org/)
- **npm** >= 9.x (comes with Node.js)
- **Git** >= 2.x → [Download](https://git-scm.com/)

---

## 1. Clone the Repository

```bash
git clone https://github.com/Ronak-001/Mentorship-Platform.git
cd Mentorship-Platform
```

---

## 2. Setup Environment Variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in the values. Ask your team lead for the **MongoDB URI**, **JWT Secret**, and **Cloudinary** credentials.

---

## 3. Install Dependencies

**Backend:**

```bash
cd backend
npm install
```

**Frontend:** (open a new terminal)

```bash
cd frontend
npm install
```

---

## 4. Run Locally

**Start the backend:** (from `backend/` folder)

```bash
npm run dev
```

**Start the frontend:** (from `frontend/` folder, in a separate terminal)

```bash
npm start
```

The app will be available at:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## Project Structure

```
Mentorship-Platform/
├── backend/          # Express API + Socket.io
│   ├── config/       # Cloudinary config
│   ├── middleware/    # Auth middleware
│   ├── models/       # Mongoose schemas
│   ├── routes/       # API routes
│   └── server.js     # Entry point
├── frontend/         # React app
│   ├── src/
│   │   ├── components/   # All UI components
│   │   └── utils/        # Helper utilities
│   └── vercel.json       # Vercel SPA config
├── requirements.txt  # System prerequisites
└── README.md
```
