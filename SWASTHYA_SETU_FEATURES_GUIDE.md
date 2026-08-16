# 🏥 SwasthyaSetu (स्वास्थ्य सेतु) — Full Features & Technical Guide

> **Project Title**: SwasthyaSetu (स्वास्थ्य सेतु)  
> **Repository**: [https://github.com/Shubham-k-yadav/SwasthyaSetu.git](https://github.com/Shubham-k-yadav/SwasthyaSetu.git)  
> **Tech Stack**: MERN Stack (MongoDB, Express.js, React 19, Node.js, Socket.io, Tailwind CSS, Leaflet Maps)  

---

## 📌 Executive Overview (SwasthyaSetu Kya Hai?)

**SwasthyaSetu (स्वास्थ्य सेतु)** ek real-time emergency healthcare coordination network hai jo medical emergency ke waqt patients, hospitals, blood banks, aur voluntary donors ko ek jagah jorta hai.

Bharat me emergency ke waqt sabse badi problem hoti hai ki patients aur unke pariwar ko pata nahi hota ki **kis hospital me ICU bed, ventilator ya blood available hai**. SwasthyaSetu is problem ko real-time data tracking, atomic concurrency safety, aur WebSocket alerts ke dwara solve karta hai.

---

## 🌟 Comprehensive Feature List (Har Feature Ki Full Detail)

### 1. 🏥 Real-Time Bed Availability & Live Freshness Indicators
* **3 Types ke Emergency Beds**: Real-time me har hospital ke **ICU Beds**, **General Beds**, aur **Ventilator Beds** ki availability dikhata hai.
* **🟢 Live Freshness Calculation (`getFreshnessStatus`)**:
  * **🟢 Live & Fresh (< 2 Hours)**: Agar hospital ne pichle 2 ghante ke andar bed data update kiya hai, toh **Green Badge** (`Updated X mins ago`) dikhta hai.
  * **🟡 ⚠️ Stale Data (2 - 6 Hours)**: 2 se 6 ghante purana data hone par **Yellow Warning Badge** (`⚠️ Stale - Updated X hours ago`) dikhta hai.
  * **🩶 ⏳ Outdated (> 6 Hours)**: 6 ghante se purana untouched data automatic **Grayed Out** ho jata hai aur card ki opacity kam ho jaati hai (`⏳ Outdated (>6h)`).

---

### 2. ⚡ Atomic Concurrency-Safe Bed Hold (10-Minute Reservation)
* **Problem Solved**: Jab sirf 1 ICU bed bacha hota hai aur 2 patients ek saath SOS request bhejte hain, toh traditional systems dono ko bed dikha dete hain (Double Booking Problem).
* **MongoDB Atomic Lock (`findOneAndUpdate`)**:
  * SwasthyaSetu DB level par atomic condition lagata hai:
    ```javascript
    const filter = {
      _id: hospitalId,
      [`beds.${bedType}.available`]: { $gt: 0 } // Sirf tabhi update hoga jab bed > 0 ho!
    };
    const update = {
      $inc: { [`beds.${bedType}.available`]: -1 },
      $set: { lastUpdated: new Date() }
    };
    ```
  * Sirf **1 patient** ka bed count atomic tarike se decrement hota hai. Dusre patient ko turant `409 Conflict: Bed no longer available` ka alert milta hai.
* **10-Minute Hold Code**: Citizen ko 1-click reservation par unique confirmation code milta hai (e.g. `SS-HOLD-948210`). Patient counter par yeh code dikha kar bed confirm kar sakta hai.
* **Confirm & Release Handlers**: Hospital admin counter par admission confirm kar sakta hai (`/confirm`), ya agar patient nahi aaya toh hold cancelled karke bed count waapas increment kar sakta hai (`/release`).

---

### 3. 🛡️ Super-Admin Hospital Verification Queue (Data Integrity)
* **Default Unverified State**: Naya registered hospital `isVerified: false` aur `verificationStatus: 'pending'` ke saath start hota hai.
* **Public Search Filtering**: Public citizens ki search me unverified hospitals **nahi dikhte**, jisse fake data public tak na pahuche.
* **Approval Queue Dashboard**: Super-Admin portal (`AdminHospitalsPage.jsx`) me ek dedicated **"Unverified Hospital Approval Queue"** hai jaha Super-Admin hospital ke uploaded **Registration Certificates** review karke 1-click me **Approve & Verify** ya **Reject** kar sakte hain.

---

### 4. 🩸 Real-Time Blood Bank Inventory & Voluntary Donor Network
* **Blood Group Search**: Users `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` ke basis par nearby blood banks me units search kar sakte hain.
* **Low Inventory Alerts**: Low blood stock units highlight hote hain.
* **Voluntary Donor Network**: Donors apna name, blood group, city, aur contact register kar sakte hain jisse emergency me zarooratmand patient direct call kar sakein.

---

### 5. 🚨 Emergency SOS & Geo-Location Nearest Hospital Finder
* **Haversine Distance Formula**: Patient ki GPS coordinates (`lat`, `lng`) se sabse paas waale emergency hospitals ka distance exact km me calculate karta hai.
* **Socket.io Live Alert Broadcast**: Patient SOS form submit karte hi WebSocket server patient ki city ke sabhi connected hospital dashboard screens par instant audio/visual alert trigger kar deta hai.

---

### 6. 🌐 Multi-Language Toggle (English & हिंदी)
* Website ke top header par 1-click **`English (EN)` / `हिंदी (HI)`** toggle button hai.
* Ek click me poora navigation bar, bed types, action buttons, aur alert text Hindi ya English me convert ho jate hain.

---

### 7. 🔒 Enterprise Security & Anti-Spam Defense
* **Rate Limiting (`express-rate-limit`)**:
  * **General API**: 100 requests / 15 mins.
  * **Emergency SOS & Bed Hold**: 10 submissions / 15 mins per IP (Spam aur DDoS prevention).
  * **Auth Login**: 5 attempts / 15 mins (Brute-force protection).
* **NoSQL Injection Sanitization (`express-mongo-sanitize`)**: Incoming inputs se `$` aur `.` MongoDB query operators ko automatic strip kar deta hai.
* **JWT Role Guards**: Server-side endpoints strictly enforce karte hain `authenticate` aur `authorize('admin', 'superadmin')` checks.

---

### 8. 💡 System Status & Degraded Demo Mode Transparency
* **Status API (`/health` & `/api/status`)**: Database connectivity aur execution mode inspect karta hai.
* **Transparent Fallback Banner**: Agar local MongoDB database offline bhi ho, toh server crash nahi hota. System Zero-delay Mock Store par chalta hai aur top header me transparent amber banner dikhata hai:
  `⚠️ Transparent System Mode: Local MongoDB is currently offline. System running in Degraded Demo Mode (in-memory store reset on restart).`

---

## 🗄️ Database Schemas Summary

1. **Hospital (`backend/src/models/Hospital.js`)**:
   - `name`, `address`, `city`, `state`, `coordinates` (`lat`, `lng`), `phone`, `email`
   - `beds`: `{ icu: { total, available }, general: { total, available }, ventilator: { total, available } }`
   - `isVerified` (Boolean), `verificationStatus` (`pending`, `approved`, `rejected`), `registrationCertificate`
   - `lastUpdated` (Date)

2. **BedReservation (`backend/src/models/BedReservation.js`)**:
   - `hospitalId`, `bedType`, `patientName`, `contactPhone`, `reservationCode`, `status` (`reserved`, `confirmed`, `released`, `expired`), `expiresAt`

3. **BloodStock (`backend/src/models/BloodStock.js`)**:
   - `hospitalId`, `bloodGroup`, `unitsAvailable`, `minimumRequired`, `lastUpdated`

4. **EmergencyRequest (`backend/src/models/EmergencyRequest.js`)**:
   - `patientName`, `contactPhone`, `location`, `emergencyType`, `bedType`, `priority`, `status`, `assignedHospital`

5. **User (`backend/src/models/User.js`)**:
   - `email`, `password` (bcrypt hash), `name`, `role` (`admin`, `superadmin`), `hospitalId`

---

## 🚀 How to Run SwasthyaSetu Locally

### Prerequisites:
- Node.js (v18+ or v20+)
- npm

### Steps:
1. **Clone & Install Dependencies**:
   ```bash
   git clone https://github.com/Shubham-k-yadav/SwasthyaSetu.git
   cd SwasthyaSetu
   npm run setup
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5000`
   - **Health Check**: `http://localhost:5000/health`

3. **Build Verification**:
   ```bash
   npm run build
   ```

---

## 📌 Summary for AI / Presentation
* **What is it?** Real-Time Emergency Healthcare, ICU Bed & Blood Coordination Network.
* **Core Highlight?** Zero double-booking via MongoDB atomic locks, live 2-hour data freshness indicators, hospital verification queue, real-time WebSocket SOS broadcasts, and Hindi/English translation toggle.
