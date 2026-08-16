# PROJECT SYNOPSIS

## 🏥 Project Title: SwasthyaSetu (स्वास्थ्य सेतु)
> **Real-Time Emergency Healthcare, ICU Bed & Blood Coordination Network**

---

### 📋 1. Executive Summary & Abstract

During medical emergencies in India, every second counts. Patients and families often face extreme panic searching for available **ICU beds, ventilators, and specific blood units**, wasting critical hours calling multiple hospitals or traveling across cities blindly.

**SwasthyaSetu (स्वास्थ्य सेतु)** is a modern, high-performance **MERN Stack (MongoDB, Express.js, React 19, Node.js)** web application engineered to bridge the gap between patients, hospitals, blood banks, and voluntary donors. It provides a real-time digital platform featuring interactive map geolocations, live bed & blood inventory search with 2-hour freshness badges, concurrency-safe 10-minute atomic bed holds, instantaneous WebSockets emergency broadcast alerts, and an intuitive Hospital Management Dashboard.

---

### 🚨 2. Problem Statement

1. **Lack of Real-Time Visibility**: Patients have no single unified portal to verify live ICU, General, or Ventilator bed availability across nearby hospitals.
2. **Double-Booking & Race Conditions**: Simultaneous emergency requests often attempt to book the last available ICU bed, causing dangerous medical rejection at hospital counters.
3. **Unverified Hospital Data**: Unapproved or fake hospital listings can misguide patients in life-or-death situations.
4. **Critical Blood Availability Delay**: Finding rare blood types (e.g., O-negative, AB-negative) during surgeries relies on fragmented phone calls.
5. **Security & Spam Threats**: Public emergency forms are vulnerable to bot spam and NoSQL injection attacks.

---

### 💡 3. Proposed Solution

**SwasthyaSetu** solves these critical challenges through a clean, ultra-responsive web platform:

- **Instant Emergency Locator**: Uses GPS coordinates and interactive maps (Leaflet) with Haversine distance calculations to show closest hospitals.
- **Atomic 10-Minute Bed Holds**: MongoDB `findOneAndUpdate` atomic checks (`availableBeds > 0`) eliminate double booking and issue instant 10-minute hold codes (`SS-HOLD-XXXXXX`).
- **Super-Admin Hospital Verification Queue**: Registration certificates are verified by Super-Admins before unverified hospital listings become publicly visible.
- **Live 2-Hour Freshness Badges**: Color-coded badges (🟢 Fresh <2h, 🟡 Stale 2-6h, 🩶 Outdated >6h) ensure users always see accurate timestamped data.
- **Live Blood & Donor Network**: Filter blood stocks by blood group (`A+`, `B+`, `O-`, etc.), city, and min units required, or connect directly with voluntary donors.
- **Real-Time Emergency SOS Broadcast**: Built-in **Socket.io WebSockets** engine to trigger immediate emergency alerts on hospital admin dashboards.
- **Multi-Language Toggle (English & हिंदी)**: 1-click toggle for complete English / Hindi UI translation.
- **Fail-Safe Hybrid Architecture**: Operates seamlessly with local MongoDB or automatically activates a transparent **Zero-Delay Demo Mode** if the database service is offline.

---

### 🛠️ 4. Technology Stack

| Layer | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 (Vite SPA)** | Modern single-page application for lightning-fast rendering. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Responsive, glassmorphism design system built for mobile & desktop. |
| **Interactive Maps** | **Leaflet & React-Leaflet** | Open-source interactive map markers & route directions. |
| **Data Visualization** | **Recharts** | Real-time charts for ICU bed occupancy & blood bank metrics. |
| **Backend Runtime** | **Node.js & Express.js** | Modular RESTful API server with clean route architecture. |
| **Database & ORM** | **MongoDB & Mongoose** | Flexible document store with atomic updates (`findOneAndUpdate`). |
| **Real-Time Engine** | **Socket.io** | WebSockets bi-directional communication for live emergency SOS alerts. |
| **Security & Protection** | **Express-Rate-Limit & Mongo-Sanitize** | Anti-DDoS rate limiting & NoSQL injection prevention. |
| **Authentication** | **JWT & BcryptJS** | Secure role-based authorization for Super Admin & Hospital Admins. |

---

### ⚙️ 5. Key Functional Modules

#### 🖥️ A. Public Citizen Portal
1. **Home Landing Page**: High-impact hero banner, real-time platform statistics, emergency quick action buttons.
2. **Hospital Bed Finder**: Filter hospitals by City, Bed Type (`ICU`, `General`, `Ventilator`), view live freshness badges, and trigger 10-minute atomic bed holds.
3. **Blood Availability & Donor Directory**: Real-time blood unit inventory check across hospital blood banks and voluntary donor search by blood group & city.
4. **Emergency SOS Request**: Instant emergency request submission form with location auto-detection, priority tagging, and WebSockets live broadcast.
5. **Multi-Language Toggle**: Switch between English and Hindi (`हिंदी`) in 1-click.

#### 🛡️ B. Hospital Admin & Operations Portal
1. **Super-Admin Hospital Verification Queue**: Review uploaded registration certificates and approve/reject unverified hospital registrations.
2. **Live Bed Management Dashboard**: Update ICU, General, and Ventilator bed counts with instant WebSockets broadcast to all active citizens.
3. **Emergency Dispatch Center**: View incoming real-time emergency SOS alerts with patient GPS location and contact phone.
4. **Bed Hold Confirmation**: Counter admission confirmation (`/confirm`) and hold release (`/release`).
5. **System Transparency Monitor**: Live system status monitor showing MongoDB connectivity and transparent execution mode.

---

### 🚀 6. Repository Link
- **GitHub Repository**: [https://github.com/Shubham-k-yadav/SwasthyaSetu.git](https://github.com/Shubham-k-yadav/SwasthyaSetu.git)
- **Detailed Features Guide**: [SWASTHYA_SETU_FEATURES_GUIDE.md](file:///c:/Users/shubh/Videos/Project/midlink/SWASTHYA_SETU_FEATURES_GUIDE.md)
