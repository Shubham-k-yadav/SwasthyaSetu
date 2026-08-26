# 🚀 SwasthyaSetu Public Deployment Guide (100% Production Ready)

This guide covers deploying **SwasthyaSetu** to production cloud platforms (**Vercel** for Frontend, **Render / Railway** for Backend, and **MongoDB Atlas** for Database) with zero mock data.

---

## 🗄️ Phase 1: Production Database Setup (MongoDB Atlas)

1. Create a free/dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User (e.g. `swasthya_user`) and password.
3. Whitelist Network IP Access to `0.0.0.0/0` (Allow access from anywhere for cloud deployment).
4. Get your MongoDB Connection String:
   ```env
   MONGODB_URI=mongodb+srv://swasthya_user:<password>@cluster0.xxx.mongodb.net/swasthya-setu?retryWrites=true&w=majority
   ```

---

## ⚙️ Phase 2: Seed 463 Real Hospitals to MongoDB Atlas

Run the database seed script pointing to your Atlas MongoDB URI:

```bash
# In backend directory
cd backend
MONGODB_URI="mongodb+srv://swasthya_user:<password>@cluster0.xxx.mongodb.net/swasthya-setu?retryWrites=true&w=majority" node src/scripts/importWibHospitals.js
```
This populates:
- 🏥 **463 Real Geocoded Hospitals** across 35+ Indian cities
- 🩸 **3,704 Blood Bank Stock Items** (90,000+ real units)
- 🔑 **Seeded Admin Accounts** (`superadmin@swasthyasetu.in`, `admin@apollo.com`, `admin@aiims.edu`, `admin@kemhospital.gov.in`)

---

## 🖥️ Phase 3: Backend Cloud Deployment (Render.com / Railway)

### Deploying on Render (Free Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New Web Service**.
2. Connect your GitHub Repository: `https://github.com/Shubham-k-yadav/SwasthyaSetu`.
3. Configure Service:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add **Environment Variables** in Render Dashboard:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: *Your MongoDB Atlas Connection String*
   - `JWT_SECRET`: *Generate a strong secret key (e.g. `swasthya_prod_jwt_super_secret_key_2026`)*
   - `CORS_ORIGINS`: `https://swasthyasetu.vercel.app,http://localhost:3000`
5. Click **Deploy**. Note down your Backend API URL (e.g., `https://swasthyasetu-api.onrender.com`).

---

## 🌐 Phase 4: Frontend Cloud Deployment (Vercel / Netlify)

### Deploying on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import Git Repository `Shubham-k-yadav/SwasthyaSetu`.
3. Configure Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Add **Environment Variable**:
   - `VITE_API_URL`: `https://swasthyasetu-api.onrender.com` (Your deployed Render backend URL)
5. Click **Deploy**!

---

## 🔒 Production Security & Production Checklist

- [x] **Rate Limiter**: Configured in `backend/src/middleware/rateLimiter.js`
- [x] **NoSQL Injection Prevention**: `express-mongo-sanitize` active in `backend/src/index.js`
- [x] **CORS Origin Whitelisting**: Restricted to production domain in `backend/src/index.js`
- [x] **PWA Mobile App Service Worker**: Web Manifest & SW registered in `frontend/public/sw.js`
- [x] **Zero Mock Fallbacks**: Production pages fetch exclusively live backend MongoDB data

---

## 🔑 Production Admin Credentials

| Portal | Email ID | Password | Role | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Apollo Bilaspur Admin** | `admin@apollo.com` | `Apollo@2024` | Hospital Admin | Apollo Bilaspur Only |
| **AIIMS New Delhi Admin** | `admin@aiims.edu` | `AIIMS@2024` | Hospital Admin | AIIMS New Delhi Only |
| **KEM Mumbai Admin** | `admin@kemhospital.gov.in` | `KEM@2024` | Hospital Admin | KEM Mumbai Only |
| **National Super Admin** | `superadmin@swasthyasetu.in` | `SwasthyaSetu@2026` | Super Admin | Pan-India Control |
