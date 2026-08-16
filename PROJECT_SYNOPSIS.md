# PROJECT SYNOPSIS

## 🏥 Project Title: SwasthyaSetu (स्वास्थ्य सेतु)
> **Real-Time Emergency Healthcare, ICU Bed & Blood Coordination Network**

---

### 📋 1. Executive Summary & Abstract

During medical emergencies in India, every second counts. Patients and families often face extreme panic searching for available **ICU beds, ventilators, and specific blood units**, wasting critical hours calling multiple hospitals or traveling across cities blindly.

**SwasthyaSetu (स्वास्थ्य सेतु)** is a modern, high-performance **MERN Stack (MongoDB, Express.js, React, Node.js)** web application engineered to bridge the gap between patients, hospitals, blood banks, and voluntary donors. It provides a real-time digital platform featuring interactive map geolocations, live bed & blood inventory search, instantaneous WebSockets emergency broadcast alerts, and an intuitive Hospital Management Dashboard.

---

### 🚨 2. Problem Statement

1. **Lack of Real-Time Visibility**: Patients have no single unified portal to verify live ICU, General, or Ventilator bed availability across nearby hospitals.
2. **Critical Blood Availability Delay**: Finding rare blood types (e.g., O-negative, AB-negative) during surgeries relies on fragmented WhatsApp groups or physical phone calls.
3. **Emergency Response Latency**: Traditional referral systems lack instant emergency broadcast alerts to nearby hospital trauma units.
4. **Complex Technical Overhead**: Existing hospital software is often heavy, bloated, and crashes when database services go offline.

---

### 💡 3. Proposed Solution

**SwasthyaSetu** solves these critical challenges through a clean, ultra-responsive web platform:

- **Instant Emergency Locator**: Uses GPS coordinates and interactive maps (Leaflet) to show the closest hospitals with verified bed availability.
- **Live Blood & Donor Network**: Filter blood stocks by blood group (`A+`, `B+`, `O-`, etc.), city, and min units required, or connect directly with verified voluntary donors.
- **Real-Time Emergency SOS Broadcast**: Built-in **Socket.io WebSockets** engine to trigger immediate emergency alerts on hospital admin dashboards.
- **Fail-Safe Hybrid Architecture**: Operates seamlessly with local MongoDB or automatically activates an **Instant Zero-Delay Demo Mode** if the database service is offline, ensuring 100% uptime.

---

### 🛠️ 4. Technology Stack

| Layer | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 (Vite SPA)** | Modern single-page application for lightning-fast rendering. |
| **Styling & UI** | **Tailwind CSS + Lucide Icons** | Responsive, glassmorphism design system built for mobile & desktop. |
| **Interactive Maps** | **Leaflet & React-Leaflet** | Open-source interactive map markers & route directions. |
| **Data Visualization** | **Recharts** | Real-time charts for ICU bed occupancy & blood bank metrics. |
| **Backend Runtime** | **Node.js & Express.js** | Modular RESTful API server with clean route architecture. |
| **Database & ORM** | **MongoDB & Mongoose** | Flexible document store for hospitals, blood stocks, donors & emergencies. |
| **Real-Time Engine** | **Socket.io** | WebSockets bi-directional communication for live emergency SOS alerts. |
| **Authentication** | **JWT (JSON Web Tokens) & BcryptJS** | Secure role-based authorization for Super Admin & Hospital Admins. |

---

### ⚙️ 5. Key Functional Modules

#### 🖥️ A. Public Citizen Portal
1. **Home Landing Page**: High-impact hero banner, real-time platform statistics, emergency quick action buttons.
2. **Hospital Bed Finder**: Filter hospitals by City, Bed Type (`ICU`, `General`, `Ventilator`), search by name/address, view map markers, and click for direct Google Maps navigation.
3. **Blood Availability & Donor Directory**: Real-time blood unit inventory check across hospital blood banks and voluntary donor search by blood group & city.
4. **Emergency SOS Request**: Instant emergency request submission form with location auto-detection, priority tagging (`Critical`, `High`, `Normal`), and bed/blood requirements.
5. **Contact & Support**: Support query form, emergency hotline numbers (102, 108, 112), and interactive FAQ system.

#### 🛡️ B. Hospital Admin & Operations Portal
1. **Secure Admin Authentication**: JWT token-based login for hospital managers & super administrators.
2. **Real-Time Analytics Dashboard**: Visual stat cards for Total Hospitals, Available ICU Beds, Ventilators, and Critical Blood Groups.
3. **Hospital Inventory Manager**: Update bed capacity (total vs available) and maintain verified status.
4. **Blood Stock Manager**: Live blood inventory editor with low-stock warning indicators.
5. **Emergency SOS Triage Center**: Live WebSockets alert feed for incoming emergency requests with Accept / Process / Complete status actions.
6. **Donor Management**: Register new voluntary donors and update availability status.

---

### 📐 6. System Architecture & Data Flow

```text
[ Citizen / Patient ] ──► [ React 19 Frontend ] ──► [ Express REST APIs ] ──► [ MongoDB Database ]
                                │                               ▲
                                │ (Socket.io)                   │ (Fallback)
                                ▼                               ▼
                     [ Live Admin Dashboard ] ◄────── [ In-Memory MockStore ]
```

---

### 🗄️ 7. Database Models (Schemas)

1. **User Schema**: `name`, `email`, `password` (hashed), `role` (`superadmin`, `admin`), `hospitalId`.
2. **Hospital Schema**: `name`, `address`, `city`, `state`, `coordinates` (`lat`, `lng`), `phone`, `email`, `beds` (`icu`, `general`, `ventilator`), `emergencyServices`, `isVerified`, `rating`.
3. **BloodStock Schema**: `hospitalId`, `bloodGroup` (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`), `unitsAvailable`, `isLow`, `lastUpdated`.
4. **Donor Schema**: `name`, `phone`, `email`, `bloodGroup`, `city`, `state`, `age`, `weight`, `isAvailable`, `totalDonations`.
5. **EmergencyRequest Schema**: `patientName`, `contactNumber`, `emergencyType` (`bed`, `blood`, `both`), `bedsNeeded`, `bedType`, `bloodType`, `unitsNeeded`, `location`, `priority`, `status`.

---

### 🚀 8. Performance & Optimization Achievements

- **Clean Architecture**: Refactored monorepo into standard `frontend/` and `backend/` folders.
- **Lightweight CSS Bundle**: Minified Tailwind CSS output down to **76.69 KB** (gzip: 17.31 KB).
- **Zero-Crash Resilience**: Built-in 1.5s connection fallback to instant memory store, preventing downtime during database maintenance.
- **Modern ES6+ Syntax**: Clean optional chaining (`?.`) preventing UI runtime crashes.

---

### 🔮 9. Future Enhancements

1. **108 Ambulance GPS Integration**: Live tracking of incoming emergency ambulances on hospital maps.
2. **WhatsApp / SMS Gateway**: Automated SMS & WhatsApp alerts to nearest matched blood donors during critical blood shortages.
3. **AI Triage Predictor**: Predictive algorithms to estimate bed availability based on historical admission rates.

---

### 📝 10. Conclusion

**SwasthyaSetu (स्वास्थ्य सेतु)** demonstrates how modern web technologies (React 19, Node.js, Socket.io, MongoDB) can be leveraged to build a life-saving, real-time healthcare infrastructure for India. By providing instant visibility into hospital beds and blood banks, SwasthyaSetu empowers citizens and healthcare professionals to act rapidly when every second counts.
