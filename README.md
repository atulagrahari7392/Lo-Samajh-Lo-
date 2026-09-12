# 📚 Lo Samajh Lo — Full-Stack LMS & Educational Platform

A modern, fast, and feature-rich Learning Management System (LMS) and Competitive Exam Preparation platform built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js/Express**, and **Prisma ORM**.

---

## 🚀 Features

- 🎓 **Course Management**: Video lectures, syllabus breakdown, free preview demo lessons, enrollment tracking.
- 📝 **Live Mock Test Series**: Full-length test engine with timer, question palette, marks/negative marking, instant scorecard & rank calculation.
- ⌨️ **Typing Test Engine**: Real-time WPM, Net WPM, accuracy %, error tracking (supporting English & Hindi मंगल font).
- 📂 **Study Material & PDFs**: Categorized downloadable notes and exam syllabus guides.
- 📅 **Live Classes & Recorded Lectures**: Google Meet links for live sessions and embedded video player for recorded archive.
- 🛒 **Cart & Promo Code System**: Discounts, coupons, simulated instant checkout.
- 🛡️ **Comprehensive Admin Dashboard**: Full control over courses, lessons, questions, tests, materials, promo codes, orders, and user roles.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6
- **Backend**: Node.js, Express, Prisma ORM, JWT Authentication, Multer file upload
- **Database**: SQLite (built-in out-of-the-box, zero external DB configuration required)
- **Deployment Ready**: Render (`render.yaml`), Netlify (`netlify.toml`)

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm installed

### 1. Install & Build Everything
```bash
npm run build
```

### 2. Start the Application
```bash
npm start
```
The unified server will start at `http://localhost:5000` (serving both backend API and frontend client).

---

## 🌐 Deploy to Render (Free & Fast)

### Option 1: Automatic Blueprint (Recommended)
1. Push this repository to your **GitHub** account.
2. Log in to [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** ➔ **"Blueprint"**.
4. Select your `lo-samajh-lo` GitHub repository.
5. Render reads `render.yaml` automatically. Click **"Apply"**!

### Option 2: Manual Web Service
1. On [Render Dashboard](https://dashboard.render.com), click **"New +"** ➔ **"Web Service"**.
2. Connect your GitHub repository.
3. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: `file:./dev.db`
   - `JWT_SECRET`: `your_random_secret_key`
5. Click **"Deploy Web Service"**!

---

## 🔑 Default Seed Credentials

When deployed, the database is automatically seeded with sample courses, mock tests, and the following accounts:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@losamajhlo.in` | `admin123` |
| **Instructor** | `teacher@losamajhlo.in` | `teacher123` |
| **Student** | `student@losamajhlo.in` | `student123` |

---

## 📄 License
ISC License — Created for Lo Samajh Lo.
