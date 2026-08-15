# SwasthyaSetu (स्वास्थ्य सेतु) - MERN Stack Healthcare Platform

> **Real-time Emergency Healthcare, ICU Bed & Blood Availability Network for India**
> Built with **MongoDB, Express.js, React (Vite SPA), Node.js, Socket.io & Tailwind CSS**.

---

## 📌 Project Overview (विवरण)

**SwasthyaSetu (स्वास्थ्य सेतु)** is a modern MERN stack healthcare platform designed to connect hospitals, blood banks, donors, and emergency responders across India in real-time.

---

## 📁 Simple Folder Structure (स्ट्रक्चर)

```
swasthya-setu/
├── backend/                    # Node.js + Express API + Mongoose + Socket.io
│   ├── src/
│   │   ├── config/             # DB (MongoDB) connection
│   │   ├── models/             # Mongoose Schemas (User, Hospital, BloodStock, Donor, Emergency)
│   │   ├── routes/             # Express API Endpoints
│   │   ├── middleware/         # Auth (JWT) & Validation middlewares
│   │   └── scripts/            # Database seed script (seed.js)
│   ├── .env                    # Environment file
│   └── package.json
│
├── frontend/                   # React 19 SPA + Vite + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/         # UI & Header/Footer components
│   │   ├── pages/              # Public Pages (Home, Hospitals, Blood, Emergency, Contact)
│   │   └── pages/admin/        # Admin Dashboard pages
│   ├── .env                    # Environment file
│   └── package.json
│
├── package.json                # Root orchestration (Run dev, setup, seed, build)
├── .gitignore                  # Clean git ignore
└── README.md                   # Project documentation
```

---

## ⚡ Quick Start Guide (शुरू कैसे करें)

### 1. Installation (इन्स्टॉलेशन)

Run the setup command from the project root to install dependencies for both `backend` and `frontend`:

```bash
npm run setup
```

---

### 2. Run Development Server (एप्लिकेशन चलाएं)

Start both Backend API server (port 5000) and Frontend React SPA (port 3000) with a single command:

```bash
npm run dev
```

- **Frontend (Client)**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Demo Admin Credentials (एडमिन लॉग इन)

Login at `/admin/login`:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin@medlink.com` | `MedLink@2024` |
| **AIIMS Admin** | `admin@aiims.edu` | `AIIMS@2024` |

---

## 🚀 Production Build

```bash
npm run build
```

---

## 📜 License
MIT License. Built for SwasthyaSetu India.
