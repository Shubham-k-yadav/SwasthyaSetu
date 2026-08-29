# 🏥 SwasthyaSetu (स्वास्थ्य सेतु) - Full Project Documentation & Feature Guide

> **National Emergency Healthcare, Bed Occupancy, Blood Availability, Ambulance GPS Tracking & Multi-Entity Onboarding Platform for India.**

---

## 📌 Executive Summary

**SwasthyaSetu (स्वास्थ्य सेतु)** is a real-time emergency healthcare bridge designed for India. It addresses the critical "Golden Hour" crisis during medical emergencies by providing real-time, verified access to hospital beds (General, ICU, Ventilators), live blood bank stocks, emergency SOS dispatch, live ambulance GPS tracking, and multi-entity self-onboarding (Hospitals, Blood Banks, Ambulance Operators).

The platform eliminates the need for frantic phone calls during life-threatening situations by offering atomic 10-minute bed reservations backed by OTP verification, Polygon blockchain data hashing, and a 3-Tier AI Translation Engine.

---

## 🚀 Technology Stack

### 🎨 Frontend Architecture
* **Framework**: React 18 (Vite 6 SPA)
* **Styling**: Vanilla CSS + TailwindCSS + Shadcn UI Design System
* **Icons**: Lucide React Icons
* **Maps & Navigation**: React-Leaflet + Leaflet OpenStreetMap Geocoding
* **Real-time WebSockets**: Socket.io-client
* **State & Localization**: React Context API (`LanguageContext`, `AuthContext`)
* **Notifications**: Sonner Toasts + Web Browser Notification API + Emergency Audio Siren Synthesizer

### ⚙️ Backend Architecture
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Database**: MongoDB Atlas / Local MongoDB (Mongoose ORM)
* **Real-time Server**: Socket.io Server (Broadcasting live bed, blood, and ambulance updates across all connected clients)
* **Security**: JWT Authentication, Express Rate Limiter (`express-rate-limit`), Helmet, CORS, NoSQL Injection Sanitization (`express-mongo-sanitize`)
* **AI Translation Engine**: 3-Tier Hybrid AI Engine (Google Gemini 1.5 Flash + OpenAI GPT-4o-mini + Free Google Translate Proxy with In-Memory LRU Cache)

---

## ✨ Complete Feature Breakdown

### 1. 📢 Demo Mode Disclosure Banner & System Status (`GET /api/system/status`)
* **Demo Mode Flag (`DEMO_MODE=true/false`)**: Transparently informs users whether data is running in demo/simulated mode or live production mode.
* **Dismissible Alert Component (`DemoModeBanner.jsx`)**: Non-intrusive alert at the top of HomePage, HospitalsPage, and BloodPage stating:
  > *"This platform is running in demo mode. Bed and blood data shown for unverified/simulated hospitals is illustrative, not real-time. X verified hospitals are providing live data."*
* **System Status API**: `GET /api/system/status` computes real-time counts of `realHospitalsCount` (`isVerified: true`, `isSimulated: false`) vs `simulatedHospitalsCount` (`isSimulated: true`).

---

### 2. 🏥 Real-Time Hospital Bed & ICU Tracking
* **463+ Geocoded Hospitals Loaded**: Seeded with hospital data across major Indian cities (New Delhi, Mumbai, Bengaluru, Bilaspur, Chennai, Kolkata, Pune, Hyderabad, etc.).
* **3 Bed Categories**: Live availability tracking for General Beds, ICU Beds, and Ventilator Beds.
* **Freshness Badging**: Dynamic time-ago freshness indicators (*Updated 2 min ago*, *Updated 15 min ago*, *Stale Data Warning*).

---

### 3. 🩸 Blood Bank Self-Onboarding & Live Inventory Management
* **`BloodBank` Mongoose Model**: Stores blood bank profile, license numbers, linked `BloodStock` ID, and `isVerified` status.
* **Public Onboarding Modal (`BloodBankRegisterModal.jsx`)**: Allows regional blood banks to apply for onboarding.
* **Backend Endpoint (`POST /api/bloodbanks/register-request`)**: Creates unverified `BloodBank` + linked `blood_bank_admin` User account.
* **Super Admin Verification Queue**: Appears in Super Admin Control Room under **"Pending Blood Banks"** tab. Verified via `PATCH /api/bloodbanks/:id/verify`.
* **Scoped Stock Management**: `blood_bank_admin` can update blood units per blood group (A+, A-, B+, B-, AB+, AB-, O+, O-), broadcasted live via Socket.io `blood-stock-update`.

---

### 4. 🚑 Ambulance Live Location & Mobile Driver Portal (`/driver/:ambulanceId`)
* **`Ambulance` Mongoose Model**: Stores vehicle number, driver details, operational status (`available`, `en_route`, `busy`, `offline`), and live GPS coordinates.
* **Mobile Driver Portal (`DriverLocationPage.jsx`)**: Mobile-first page with a prominent **"Share My Location"** toggle button.
* **15-Second GPS Broadcast**: Automatically transmits driver GPS coordinates to `POST /api/ambulances/:id/update-location` every 15 seconds.
* **Rate-Limiting Protection**: `ambulanceLocationLimiter` restricts GPS pushes to 1 request per 10 seconds per ambulance.
* **Socket.io Live Mapping**: Broadcasts position on channel `ambulance-updates`. Emergency page Leaflet map renders live ambulance markers (`🚑`) with Haversine distance calculations.

---

### 5. 🤖 Simulated Live Data Generator (`simulateLiveData.js`)
* **Gated behind `DEMO_MODE=true`**: Runs every 2 minutes via `node-cron` inside `index.js`.
* **Strict Safety Guarantee**: **NEVER** mutates records with `isSimulated: false` or `isVerified: true` with real self-reported data. Only mutates records flagged `isSimulated: true`.
* **Realistic Jitter & Shortage Alerts**: Randomly adjusts hospital bed counts (±1 to ±3), blood bank stocks (±1 to ±5, triggering critical shortage alerts below 5 units), and ambulance map positions.
* **Auditable Logs**: Every mutation is logged with a `[SIMULATED]` prefix in the server console.

---

## 📂 Project Directory Structure

```
midlink/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB Mongoose Connection
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT Role Authentication & Scoping
│   │   │   └── rateLimiter.js        # Express Rate Limiters (API, SOS, Auth, Ambulance)
│   │   ├── models/
│   │   │   ├── Hospital.js           # Hospital & Bed Inventory Schema (isSimulated flag)
│   │   │   ├── BloodBank.js          # Blood Bank Onboarding Schema
│   │   │   ├── Ambulance.js          # Ambulance GPS Tracking Schema
│   │   │   ├── User.js               # User & Admin Role Schema (hospital_admin, blood_bank_admin, ambulance_driver)
│   │   │   ├── BloodStock.js         # Blood Bank Inventory Schema
│   │   │   ├── Donor.js              # Voluntary Blood Donor Schema
│   │   │   ├── EmergencyRequest.js   # Emergency SOS Request Log
│   │   │   └── Reservation.js        # 10-Minute Bed Hold Reservation Schema
│   │   ├── routes/
│   │   │   ├── system.js             # GET /api/system/status (Demo Mode & Counts)
│   │   │   ├── hospitals.js          # Hospital CRUD, Onboarding & Bed Hold API
│   │   │   ├── bloodbanks.js         # Blood Bank Onboarding, Verification & Stock API
│   │   │   ├── ambulances.js         # Ambulance Registration, GPS Update & Active Query API
│   │   │   ├── blood.js              # Blood Inventory Search API
│   │   │   ├── donors.js             # Blood Donor API
│   │   │   ├── emergency.js          # Emergency SOS Dispatch API
│   │   │   ├── auth.js               # Login, Verification & Admin Profile API
│   │   │   └── translate.js          # 3-Tier AI Translation API
│   │   ├── scripts/
│   │   │   ├── simulateLiveData.js   # Simulated Live Data Generator (DEMO_MODE=true)
│   │   │   └── seedData.js           # Seed Script for 463 Hospitals & Stock
│   │   └── index.js                  # Main Server Entry & Socket.io Server
│   ├── .env                          # Backend Environment Variables
│   ├── .env.example                  # Environment Template with DEMO_MODE Flag
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx            # Ultra-Responsive Header & Drawer Menu
│   │   │   ├── Footer.jsx            # Footer Component with Emergency Contacts
│   │   │   ├── DemoModeBanner.jsx     # Dismissible Demo Mode Disclosure Banner
│   │   │   ├── HospitalRegisterModal.jsx # Public Hospital Onboarding Modal
│   │   │   ├── BloodBankRegisterModal.jsx# Public Blood Bank Onboarding Modal
│   │   │   ├── hospital/
│   │   │   │   ├── hospital-card.jsx # Responsive Bed Card & Bed Hold Flow
│   │   │   │   └── bed-ticket-dialog.jsx # QR Printable Bed Ticket Modal
│   │   │   ├── maps/
│   │   │   │   └── hospital-map.jsx  # Leaflet OpenStreetMap Container (Scoped Z-Index & Ambulance Markers)
│   │   │   └── ui/                   # Shadcn UI Primitives (Button, Dialog, Badge, Input, Card)
│   │   ├── lib/
│   │   │   ├── api.js                # API Client & Axios/Fetch Wrapper
│   │   │   ├── auth-context.jsx      # JWT Auth Provider
│   │   │   ├── language-context.jsx  # Bilingual & AI Language Context
│   │   │   ├── freshness.js          # Data Freshness Helper
│   │   │   └── audio-notification.js # Audio Siren & Desktop Push Notification Helper
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Hero, Problem Statement, Features & Stats
│   │   │   ├── HospitalsPage.jsx     # Public Hospital Directory & Live Map
│   │   │   ├── BloodPage.jsx         # Live Blood Search & Donor Form
│   │   │   ├── EmergencyPage.jsx     # Emergency SOS Dispatch & Routing
│   │   │   ├── DriverLocationPage.jsx# Mobile Driver Live GPS Broadcast Page (/driver/:ambulanceId)
│   │   │   └── admin/
│   │   │       ├── AdminLoginPage.jsx     # Dual-Portal Login (Hospital vs Super Admin)
│   │   │       ├── AdminDashboard.jsx     # Super Admin National Analytics & Pending Approvals Queue
│   │   │       └── AdminHospitalsPage.jsx # Hospital Bed Update & Scoped Management
│   │   ├── App.jsx                   # React Router Routes
│   │   ├── index.css                 # Global CSS & Leaflet Z-Index Isolation Rules
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── DEPLOYMENT_GUIDE.md               # Production Deployment Steps
└── PROJECT_DOCUMENTATION.md          # Full Technical Project Manual (This File)
```

---

## 🔌 Complete API Route Reference

### 🌐 System API (`/api/system`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/system/status` | Public | Returns `{ demoMode, realHospitalsCount, simulatedHospitalsCount }` |

### 🏥 Hospitals & Onboarding API (`/api/hospitals`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hospitals` | Public | Get all verified hospitals with filters (city, bedType, limit) |
| `POST` | `/api/hospitals/register-request` | Public | Submit new hospital onboarding application (`isVerified: false`, `isSimulated: false`) |
| `GET` | `/api/hospitals/pending/queue` | Super Admin | Get unverified hospital onboarding applications |
| `PATCH` | `/api/hospitals/:id/verify` | Super Admin | Verify hospital application & generate Polygon blockchain hash |
| `POST` | `/api/hospitals/request-otp` | Public | Send 6-digit verification OTP to user phone |
| `POST` | `/api/hospitals/verify-otp` | Public | Verify user OTP code |
| `POST` | `/api/hospitals/:id/reserve-bed` | Public | Hold an ICU/General/Ventilator bed for 10 minutes |
| `PUT` | `/api/hospitals/:id/beds` | Admin | Update hospital bed counts (Broadcasts via Socket.io) |

### 🩸 Blood Bank API (`/api/bloodbanks`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bloodbanks/register-request` | Public | Submit new blood bank onboarding application |
| `GET` | `/api/bloodbanks/pending/queue` | Super Admin | Get unverified blood bank applications |
| `PATCH` | `/api/bloodbanks/:id/verify` | Super Admin | Verify blood bank & generate blockchain hash |
| `PUT` | `/api/bloodbanks/:id/stock` | Blood Bank Admin | Scoped update for blood bank inventory (Broadcasts via Socket.io) |
| `GET` | `/api/bloodbanks/all` | Public | Get all verified blood banks |

### 🚑 Ambulance API (`/api/ambulances`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ambulances/register-request` | Public | Submit new ambulance registration application |
| `GET` | `/api/ambulances/pending/queue` | Super Admin | Get unverified ambulance applications |
| `PATCH` | `/api/ambulances/:id/verify` | Super Admin | Verify ambulance operator |
| `POST` | `/api/ambulances/:id/update-location` | Rate-Limited | Driver GPS update endpoint (Max 1 req / 10s, Socket broadcast) |
| `GET` | `/api/ambulances/active` | Public | Get all active verified ambulances |
| `GET` | `/api/ambulances/:id` | Public | Get single ambulance details by ID |

---

## ⚙️ Demo Mode vs Production Deployment

---

## 📋 Operator Field Guide: How to Onboard a Real Facility in Person

### 🏥 Onboarding a Real Hospital / Clinic
1. Visit the clinic/hospital receptionist or administrator in person.
2. Hand them the printed flyer (`/onboarding-flyer`) or open `https://swasthyasetu.in/hospitals` on a mobile browser.
3. Click **"Register Facility"** and fill in basic details (Name, City, Phone, Admin Email, Password, Bed counts) in under 2 minutes.
4. Log into the Super Admin Control Room at `/admin/login` (`superadmin@swasthyasetu.in`).
5. Open the **"Hospitals"** tab in the Verification Queue and click **"Verify & Approve"**.
6. The hospital admin can now log into `/admin/login` to update their live bed availability anytime.

### 🩸 Onboarding a Real Blood Bank
1. Open `https://swasthyasetu.in/blood` and click **"Register Blood Bank"**.
2. Fill in Blood Bank Name, License Number, City, Admin Email, and Password.
3. Log into Super Admin Control Room (`/admin`), select **"Pending Blood Banks"** tab, and click **"Verify & Approve"**.
4. The blood bank operator can log into `/admin/login` to update blood group quantities, which broadcast live instantly.

### 🚑 Onboarding a Real Ambulance Operator / Driver
1. Submit vehicle number, driver name, and phone via the ambulance registration request.
2. In Super Admin Control Room (`/admin`), select **"Pending Ambulances"** tab and click **"Verify & Generate Link"**.
3. Share the unique driver URL (`/driver/:driverToken`) with the driver's phone.
4. The driver opens the link on their mobile phone and taps **"Share My Location"** (GPS coordinates update live every 15s).
