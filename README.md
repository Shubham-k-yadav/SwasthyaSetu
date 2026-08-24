# 🏥 SwasthyaSetu (स्वास्थ्य सेतु) — MERN Stack Emergency Healthcare Platform

[![Node.js](https://img.shields.io/badge/Node.js-v24.0+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.0-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose--8.6-brightgreen.svg)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Real-Time Emergency Bed Availability, Scannable QR Bed Hold Tickets & Blood Bank Coordination Network for India.**
> Connecting patients, emergency responders, hospitals, and blood banks when every second counts.

---

## 🌟 Key Features & Architectural Highlights

### 1. 🛏️ Real-Time Hospital Bed Tracker & Freshness Badges
- **Live ICU, General & Ventilator Bed Counting**: Tracks available vs. total capacity across 463+ real Indian hospitals.
- **Data Freshness Engine**: Displays **🟢 Live (< 2h)**, **🟡 Stale (2-6h)**, and **🩶 Outdated (> 6h)** badges based on the `lastUpdated` timestamp.

### 2. 🎟️ Atomic Concurrency Lock & Printable QR Code Tickets
- **Concurrency-Safe Reservation**: Prevents double-booking via MongoDB `findOneAndUpdate` atomic operators (`$inc: { 'beds.<type>.available': -1 }`).
- **10-Minute Auto-Expiry Cron**: `node-cron` running every 5 minutes releases abandoned holds and increments bed counts back.
- **Phone OTP Guard**: Validates 10-digit Indian mobile numbers (`/^[6-9]\d{9}$/`) with demo OTP verification (`123456`).
- **Scannable QR Ticket**: Custom SVG QR Code generator encoding confirmation code `SS-HOLD-XXXXXX`. Includes a 1-click **Print / Save PDF Ticket** formatted with `@media print` CSS.

### 3. 🗺️ High-Precision Geocoding Map & Dynamic Filters
- **Pan-India Map View**: Integrated Leaflet.js interactive map displaying hospital pins across 35+ Indian cities.
- **200m Precision Geocoding**: Loaded exact real-world Google Maps GPS coordinates for famous hospitals (AIIMS Delhi, Safdarjung, Medanta, KEM Mumbai, Tata Memorial, Apollo Chennai, CMC Vellore, SSKM Kolkata, SGPGI Lucknow, etc.).
- **Dynamic City Dropdown & Full-Text Search**: Filters hospitals by city, bed type, and specialty keyword matching.

### 4. 🚨 Real-Time Emergency SOS Broadcast
- **Socket.io WebSockets**: Broadcasts instant room-scoped SOS alerts (`city-${cityName}`) to online emergency responders and hospital dashboards.
- **Location Finder**: Automatically detects patient GPS coordinates or allows manual city fallback.

### 5. 🩸 Blood Bank Inventory & Donor Network
- **3,704 Blood Stock Items**: Live search for blood groups (`A+`, `O-`, etc.) across registered hospitals.
- **Voluntary Donor Registration**: Connects patients with verified blood donors.

### 6. 🌐 Multilingual & Transparent Degraded Mode
- **English & Hindi Support**: 1-Click language toggle (`en` / `hi`).
- **Transparent Degraded Demo Mode**: In-memory store fallback when local MongoDB is offline.

---

## 📐 System Architecture

### 1. High-Level Architecture Diagram

```mermaid
graph TD
    Client["📱 Client Web App (React 19 + Vite SPA)"]
    Admin["💻 Admin Dashboard (/admin)"]
    
    subgraph Backend Server ["Node.js Express API Server (Port 5000)"]
        API["Express Router (/api)"]
        AuthMiddleware["JWT Authentication Middleware"]
        Sanitize["MongoSanitize & Rate Limiters"]
        Cron["node-cron Auto-Expiry Service (5 min)"]
        SocketServer["Socket.io WebSocket Server"]
    end
    
    subgraph Storage ["Database & Real Data Layer"]
        Mongo[("MongoDB Database\n(463 Hospitals, 3704 Blood Stocks)")]
        OSM["OpenStreetMap / WIBest API Data Importer"]
    end

    Client -->|HTTP GET/POST| API
    Admin -->|JWT Bearer Token| AuthMiddleware
    AuthMiddleware --> API
    API --> Sanitize
    Sanitize --> Mongo
    Cron -->|Auto Release Hold| Mongo
    SocketServer <-->|WebSockets Realtime SOS| Client
    OSM -->|npm run seed:wib| Mongo
```

---

### 2. Atomic Bed Reservation & Concurrency Lock Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient / Citizen
    participant Client as Frontend SPA
    participant Server as Express API
    participant DB as MongoDB Database
    participant Cron as Auto-Expiry Cron Job

    Patient->>Client: Enters Mobile & Selects Bed Type (ICU)
    Client->>Server: POST /api/hospitals/request-otp { phone }
    Server-->>Client: 200 OK (Demo OTP: 123456)
    Patient->>Client: Enters OTP (123456)
    Client->>Server: POST /api/hospitals/verify-otp { phone, otp }
    Server-->>Client: 200 OK (Phone Verified)
    
    Client->>Server: POST /api/hospitals/:id/reserve-bed { bedType: 'icu' }
    Server->>DB: Atomic findOneAndUpdate({ available > 0 }, { $inc: -1 })
    alt Bed Available
        DB-->>Server: Bed Decremented Successfully
        Server->>DB: Save BedReservation (code: SS-HOLD-XXXXXX, status: reserved)
        Server-->>Client: 201 Created (Code & 10m Timer)
        Client->>Patient: Displays Scannable QR Ticket & Print Slip
    else Bed Out of Stock
        DB-->>Server: 0 Available Beds
        Server-->>Client: 400 Bad Request (No Beds Available)
    end

    opt Patient Fails to Arrive within 10 Minutes
        Cron->>DB: Find expired reservations (expiresAt < NOW)
        DB->>DB: Set status = 'released', $inc available +1
    end
```

---

### 3. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    HOSPITAL ||--o{ BED_RESERVATION : "holds"
    HOSPITAL ||--o{ BLOOD_STOCK : "maintains"
    USER ||--o{ HOSPITAL : "manages"
    USER ||--o{ EMERGENCY : "triggers"

    HOSPITAL {
        ObjectId _id PK
        string name
        string city
        string state
        object coordinates
        object beds
        array specialties
        boolean isVerified
        date lastUpdated
    }

    BED_RESERVATION {
        ObjectId _id PK
        ObjectId hospitalId FK
        string reservationCode
        string bedType
        string patientName
        string contactPhone
        string status
        date expiresAt
    }

    BLOOD_STOCK {
        ObjectId _id PK
        ObjectId hospitalId FK
        string bloodGroup
        number unitsAvailable
        number minimumRequired
        date lastUpdated
    }

    USER {
        ObjectId _id PK
        string name
        string email
        string password
        string role
        ObjectId hospitalId FK
    }

    EMERGENCY {
        ObjectId _id PK
        string patientName
        string contactPhone
        string city
        string emergencyType
        string status
    }
```

---

## ⚡ Quick Start Guide

### 1. Installation

Clone the repository and install all dependencies:

```bash
git clone https://github.com/Shubham-k-yadav/SwasthyaSetu.git
cd SwasthyaSetu
npm run setup
```

---

### 2. Database Seeding Commands

Populate MongoDB with real Indian hospitals, coordinates, and blood stocks:

| Command | Description |
| :--- | :--- |
| **`npm run seed:wib`** | **(Recommended)** Imports **463 Real Indian Hospitals** across 35+ cities with 3,704 blood stock entries. |
| **`npm run seed:real`** | Seeds 23 top metropolitan hospital centers (AIIMS, Safdarjung, Medanta, KEM, etc.). |
| **`npm run seed`** | Base seed script with initial mock data & admin accounts. |

```bash
cd backend
npm run seed:wib
```

---

### 3. Running the Server

Start both Backend API (Port 5000) and Frontend SPA (Port 3000):

```bash
# Run from root directory
npm run dev
```

- **Client Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@swasthyasetu.in` | `SwasthyaSetu@2026` | Full Network & Verification Queue Control |
| **AIIMS Admin** | `admin@aiims.edu` | `AIIMS@2024` | AIIMS Hospital Bed & Blood Management |

---

## 📡 API Reference Overview

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET /health` | GET | Server health & DB connection status | ❌ No |
| `GET /api/hospitals` | GET | List hospitals (with pagination `limit=500` & city filtering) | ❌ No |
| `POST /api/hospitals/request-otp` | POST | Request 10-digit mobile verification OTP | ❌ No |
| `POST /api/hospitals/verify-otp` | POST | Verify mobile OTP | ❌ No |
| `POST /api/hospitals/:id/reserve-bed` | POST | Atomic concurrency bed hold (10-min lock) | ❌ No |
| `POST /api/hospitals/reservations/:code/release` | POST | Cancel active hold & restore bed count | ❌ No |
| `GET /api/blood` | GET | Search blood availability across blood banks | ❌ No |
| `POST /api/emergency/request` | POST | Submit emergency SOS alert & broadcast via Sockets | ❌ No |
| `POST /api/auth/login` | POST | Hospital Admin / Superadmin JWT login | ❌ No |
| `POST /api/auth/refresh` | POST | Silent JWT token renewal | 🔑 Bearer Token |
| `GET /api/hospitals/pending/queue` | GET | View pending hospital approval queue | 🔑 Superadmin |

---

## 📜 License
MIT License. Developed for SwasthyaSetu Healthcare Network India.
