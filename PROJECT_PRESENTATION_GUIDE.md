# 🎙️ SwasthyaSetu — Project Presentation & Viva Guide

This document is designed to help you present **SwasthyaSetu** in college project reviews, hackathons, Viva examinations, and technical interviews.

---

## 🎯 1-Minute Elevator Pitch (हैकथॉन / इंटरव्यू इंट्रोडक्शन)

> *"Good morning respected judges/evaluators. Our project **SwasthyaSetu (स्वास्थ्य सेतु)** is a real-time emergency healthcare platform for India. During medical emergencies, critical time is lost searching for available ICU beds or blood groups. 
> SwasthyaSetu solves this by providing:
> 1. **Live Bed Availability Tracker** across 463+ Indian hospitals with 2-hour data freshness badges.
> 2. **Atomic Concurrency Lock**: A 10-minute bed hold with OTP verification and printable QR code tickets to prevent double-booking.
> 3. **Emergency SOS Broadcast**: Real-time room-isolated Socket.io WebSocket alerts connecting patients directly to nearby hospital emergency rooms and blood banks."*

---

## 💡 Key Technical Problem Solutions (तकनीकी समाधान)

| Real-World Challenge | How SwasthyaSetu Solves It |
| :--- | :--- |
| **Race Conditions / Double Booking** | Uses MongoDB `findOneAndUpdate` atomic operations (`$inc: { 'beds.<type>.available': -1 }`) ensuring two patients can never reserve the last ICU bed simultaneously. |
| **Fake Reservations / Bot Abuse** | Integrated 10-digit Indian phone regex validation (`/^[6-9]\d{9}$/`), OTP verification, and duplicate active reservation blocking (`429 Too Many Requests`). |
| **Abandoned Bed Holds** | Background `node-cron` job running every 5 minutes automatically releases expired 10-minute holds and increments bed counts back into inventory. |
| **Stale Data Transparency** | Displays **🟢 Live (< 2h)**, **🟡 Stale (2-6h)**, and **🩶 Outdated (> 6h)** badges based on hospital last updated timestamps. |
| **Slow Bundle Load Times** | Implemented Vite Rollup `manualChunks` code splitting and `<Suspense>` lazy loading, reducing main bundle size from 1.2 MB to 185 kB. |

---

## ❓ Anticipated Viva & Interview Questions (सम्भावित प्रश्न और उनके उत्तर)

### Q1. How does your app prevent two people from booking the last ICU bed at the same time?
**Answer**: *"We handle concurrency directly at the database level using MongoDB atomic operations (`findOneAndUpdate`). The query filters for `{ 'beds.icu.available': { $gt: 0 } }` and applies `{ $inc: { 'beds.icu.available': -1 } }`. Because MongoDB guarantees document-level atomicity, the second concurrent request fails cleanly and receives a 'Bed Out of Stock' response."*

---

### Q2. What happens if a patient holds a bed but never shows up at the hospital?
**Answer**: *"Every bed reservation creates a `BedReservation` record with `expiresAt = Date.now() + 10 minutes`. Our Node.js backend runs a `node-cron` background task every 5 minutes. It queries all expired active reservations, sets their status to `'released'`, and atomically increments the hospital's available bed count back."*

---

### Q3. How does the real-time Emergency SOS work?
**Answer**: *"We use Socket.io WebSockets. When a user submits an emergency alert on `/emergency`, the backend broadcasts a room-scoped alert (`city-${city.toLowerCase()}`) to all hospital admin dashboards and online responders connected to that city's room."*

---

### Q4. How did you load 463 real Indian hospitals and what about their location accuracy?
**Answer**: *"We integrated the open WIBest India Hospitals Dataset 2026 (`wibest.in/data/json/hospitals.json`) and wrote a custom geocoding importer (`fetchRealHospitals.js` / `importWibHospitals.js`). For famous hospitals (AIIMS, Safdarjung, Medanta, KEM, Tata Memorial, Apollo), we mapped their exact real-world Google Maps coordinates, and for locality hospitals, we used neighbourhood-level geocoding with tight 200m precision."*

---

### Q5. What is the Data Freshness Engine?
**Answer**: *"To prevent users from trusting old data, every hospital document has a `lastUpdated` timestamp. Our frontend utility calculates the time difference and assigns color badges: Green for data updated within 2 hours, Amber for 2 to 6 hours, and Grey for data older than 6 hours."*

---

## 🛠️ Tech Stack Summary Table

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, Vite 6.4, Tailwind CSS, Lucide Icons, Leaflet.js |
| **Backend API** | Node.js v24, Express 4.21, Mongoose 8.6, JWT Auth |
| **Realtime Engine** | Socket.io 4.7 (WebSocket Rooms) |
| **Background Tasks** | Node-Cron 4.6 (5-minute Bed Expiry Cleaner) |
| **Database** | MongoDB (Seeded with 463 Hospitals & 3,704 Blood Stocks) |
