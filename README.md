# CampusOne AI — Intelligent Campus Management Platform

CampusOne AI is a complete, multi-portal campus management system for students, faculty, and administrators. It features a central PostgreSQL database as the authoritative single source of truth, real-time sync (Server-Sent Events), AI academic analytics, and complete academic tracking.

---

## 🚀 Quick Start (Anyone Cloning This Repository)

### 1. Clone the repository
```bash
git clone https://github.com/bramhaji345/CampusOne-AI.git
cd CampusOne-AI
```

### 2. Install dependencies
```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
cd ..
```

---

## 🗄️ Database Setup & Instant Restore

The repository includes the complete institutional dataset (4,320 students across E1–E4, 300 faculty, all results, attendance, assignments, and timetables) pre-dumped in `backend/prisma/campusone_dump.sql.gz`.

### Option A: Automatic 1-Click Launch (Windows)
Double-click **`start-campus.bat`** in the project root:
- Automatically starts the bundled local PostgreSQL service (port 5433).
- Automatically restores the full database snapshot on first launch.
- Starts backend API (http://localhost:5000) and frontend (http://localhost:5173).

### Option B: Manual Setup with PostgreSQL
1. Ensure your PostgreSQL instance is running.
2. In `backend/.env`, set your connection string:
   ```env
   DATABASE_URL=postgresql://campusone@127.0.0.1:5433/campusone?schema=public
   JWT_SECRET=campusone-local-dev-secret-change-me
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```
3. Restore the full snapshot into your database:
   ```bash
   cd backend
   npm run db:restore
   ```
4. Start backend & frontend:
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm run dev

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

---

## 🔑 Default Login Credentials

All accounts are secured with bcrypt hashing and follow standard campus ID formats:

| Portal | Username / Campus ID | Password | Notes |
|---|---|---|---|
| **Student (E1)** | `O240001` or `o240001@campusone.edu` | `O240001@123` | First-year B.Tech CSE (Section CS1) |
| **Student (E2)** | `O230001` or `o230001@campusone.edu` | `O230001@123` | Second-year B.Tech CSE (Section CS1) |
| **Student (E3)** | `O220001` or `o220001@campusone.edu` | `O220001@123` | Third-year B.Tech CSE (Section CS1) |
| **Student (E4)** | `O210001` or `o210001@campusone.edu` | `O210001@123` | Final-year B.Tech CSE (Section CS1) |
| **Faculty** | `FAC0001` or `fac0001@campusone.edu` | `FAC0001@123` | Associate Professor, Computer Science |
| **Faculty** | `FAC0002` .. `FAC0300` | `{ID}@123` | All 300 faculty have their own ID password |
| **Administrator** | `admin@campusone.demo` | `Admin@123` | Full administrative control |

> **Browser Password Save**: The sign-in page is built with semantic HTML (`autoComplete="username"` and `autoComplete="current-password"`), allowing modern browsers to detect successful logins and offer to **Save Password**.

---

## 📊 Dataset Structure & Class Sizing

- **Total Students**: **4,320**
  - **E1**: 1,080 (`O240001` – `O241080`)
  - **E2**: 1,080 (`O230001` – `O231080`)
  - **E3**: 1,080 (`O220001` – `O221080`)
  - **E4**: 1,080 (`O210001` – `O211080`)
- **Branches & Sections**:
  - **CS**: 4 parallel sections (`CS1`, `CS2`, `CS3`, `CS4`) × 90 students per year level (360/year)
  - **EC**: 4 parallel sections (`EC1`, `EC2`, `EC3`, `EC4`) × 90 students per year level (360/year)
  - **CE**: 1 section (`CE1`, `CE2`, `CE3`, `CE4`) × 120 students per year level (120/year)
  - **EE**: 1 section (`EE1`, `EE2`, `EE3`, `EE4`) × 120 students per year level (120/year)
  - **ME**: 1 section (`ME1`, `ME2`, `ME3`, `ME4`) × 120 students per year level (120/year)
- **Academic Results**: 259,200 records (full semester marks + mid marks for all students)
- **Attendance**: 311,040 session records across all subjects
- **Timetables**: Full weekly schedules for all 44 class sections and all 300 faculty members
- **CGPA History**: 21,600 progressive semester records from E1 up to current term

---

## 🛠️ Project Structure

```text
├── start-campus.bat            # 1-click startup on Windows
├── backend/
│   ├── data/
│   │   └── campus-data.xlsx    # Full master institutional Excel workbook
│   ├── prisma/
│   │   ├── schema.prisma       # Normalized relational schema
│   │   └── campusone_dump.sql.gz # Complete database dump with all tables & rows
│   ├── src/
│   │   ├── controllers/        # Academic, Admin, Auth, Campus, Import
│   │   ├── middleware/         # JWT auth, error handlers
│   │   ├── services/           # Real-time SSE events, audit logging, mappers
│   │   └── app.js              # Express app entry
│   └── scripts/
│       ├── start-local-db.mjs  # Local PostgreSQL launcher & auto-restore
│       ├── restore-database.mjs# Database restore utility from snapshot
│       └── seed-campus-simulation.mjs # Repeatable simulation generator
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── admin/          # Students, Faculty, Certificates, Scanner, Dashboard
    │   │   ├── faculty/        # Attendance, Marks, Assignments, Outpasses, Dashboard
    │   │   ├── student/        # Results, Timetable, Attendance, Outpasses, Dashboard
    │   │   └── Login.jsx       # Multi-portal login with native password-save prompts
    │   ├── hooks/
    │   │   └── useRealtimeSync.js # Server-Sent Events client sync
    │   └── context/            # AuthContext, ToastContext, ThemeContext
    └── vite.config.js          # Vite config
```

---

## 📡 Multi-Device Central Database & Real-Time Sync

CampusOne AI uses a single PostgreSQL database as the central source of truth. Real-time updates are propagated to all connected client devices without manual browser refresh:

```text
Admin Device           Faculty Device          Student Device
     │                       │                       │
     ▼                       ▼                       ▼
  POST /api/students     POST /api/attendance     GET /api/results
     │                       │                       │
     └───────────────┬───────┴───────────────────────┘
                     ▼
           Express REST Backend
                     ▼
           Central PostgreSQL DB
                     │
      Server-Sent Events (SSE) Broadcast
                     ▼
  All connected browser clients update instantly
```

---

## 📄 License & Academic Attribution
Data and schemas are configured for institutional campus operations.
