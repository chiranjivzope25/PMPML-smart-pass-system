# PMPL Online Bus Pass Management & Conductor QR Verification System

## Project Overview
A complete digital bus pass management and validation system for **PMPL (Pune Mahanagar Parivahan Mahamandal Ltd)** built with FastAPI, SQLAlchemy, SQLite, and a modern React Vite frontend.

Both **Passengers** and **Conductors** can use the same application with dedicated role portals, seamless authentication, and real-time pass validation.

---

## Key Features

### 1. Dual User & Conductor Portals
- **Passenger Portal**:
  - Sign up & login dedicated to commuters.
  - Browse available daily, weekly, monthly, and student bus passes.
  - Book passes by providing government identification (**Aadhaar Number** and **PAN Card Number**).
  - View digital passes with the passenger's **Aadhaar ID prominently displayed as the official User ID**.
  - **Scannable QR Code** rendered on each pass for rapid conductor inspection.
  - Fullscreen pass inspection modal and printable pass slip.
  - Cancel bookings anytime.

- **Conductor Portal**:
  - Sign up with official **Conductor Badge ID** (e.g., `PMPL-C102`).
  - Dedicated **QR Scanner & Daily Pass Approval Page** (`/conductor/scan`).
  - **Live Camera Scanner**: Point camera at passenger's digital QR pass.
  - **File Upload Scanner**: Upload QR screenshot/photo.
  - **Manual Search**: Lookup by Booking ID or Aadhaar number.
  - **Daily Approval ("Allow Pass for Today")**: One-click pass validation and punch.
  - **Duplicate & Expiry Detection**: Warns if a pass is cancelled, expired, or already approved today.
  - **Daily Validation Log**: Audit table showing all passengers approved today with timestamps, bus route, and conductor details stored in the database.

---

## How to Run the Application

### 1. Automated Start (Recommended)
Simply run:
```bash
python run.py
```
This automatically starts:
- **FastAPI Backend**: `http://127.0.0.1:8000` (Swagger UI at `/docs`)
- **React Vite Frontend**: `http://127.0.0.1:5173`

### 2. Manual Start

**Backend:**
```bash
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## Database Architecture
Database: SQLite (`pmpl.db`)
- `users`: Stores user accounts with `role` (`"passenger"` or `"conductor"`) and `conductor_badge`.
- `passes`: Available bus pass tiers (Daily, Weekly, Monthly, Student).
- `bookings`: Passenger bookings containing `aadhar_number`, `pan_number`, source, destination, validity dates, and status.
- `pass_validations`: Conductor validation records linking `booking_id`, `conductor_id`, `validation_date`, `validated_at`, `bus_number`, and `status`.

---

## Automated Workflow Tests
Run the end-to-end integration test:
```bash
.venv\Scripts\python.exe test_workflow.py
```
Validates passenger registration, booking with Aadhaar & PAN, conductor QR verification, daily pass approval, and validation audit logs.

---

## Deploying to Vercel (Frontend, Backend & Database)

### 1. Database Requirement on Vercel
Vercel is a **serverless** platform where file systems are read-only and ephemeral. Local SQLite (`pmpl.db`) cannot be written to in production.
To deploy persistently, connect a free cloud PostgreSQL database:
- **Option A (Recommended - 1-Click Vercel Postgres / Neon)**:
  1. In the Vercel Dashboard, go to your project.
  2. Click the **Storage** tab -> **Create Database** -> select **Postgres** (powered by Neon).
  3. Click **Connect to Project**. Vercel will automatically inject `POSTGRES_URL` into your environment variables.
- **Option B (Neon.tech or Supabase)**:
  1. Create a free database at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
  2. Copy the connection string (`postgresql://...`).
  3. In your Vercel Project Settings -> **Environment Variables**, add:
     - `DATABASE_URL` = your copied PostgreSQL connection URI.
     - `SECRET_KEY` = your JWT secret key.

### 2. Optional: Migrate Existing Local SQLite Data to Cloud
If you already have users, bookings, or validations in your local `pmpl.db` that you want in the cloud:
```bash
.venv\Scripts\python.exe migrate_sqlite_to_cloud.py "postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Deploying via Vercel CLI
Run the following in the project root:
```bash
vercel
```
Follow the prompts (defaults are pre-configured in `vercel.json` and root `package.json`). For production deployment:
```bash
vercel --prod
```

### 4. Deploying via GitHub
1. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Configure full-stack project for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New... -> Project**.
3. Import your repository.
4. Keep the root directory as `./` (the root `vercel.json` and `package.json` handle everything automatically).
5. Attach your Vercel Postgres storage or add `DATABASE_URL` and `SECRET_KEY` in Environment Variables.
6. Click **Deploy**!
