# 🏥 Patient & Doctor Management System — Frontend Client

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-v5.0-bear?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

A modern, high-performance, responsive Web Application for clinical queue management, real-time patient tracking, dynamic prescription generation, and multi-role healthcare administration. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

- **🔐 Multi-Role Authentication & Access Control**
  - Custom RBAC dashboard layouts tailored for **Admin**, **Doctor**, **Receptionist**, and **Patient**.
  - Persistent authentication via HTTP-only cookie tokens & `useAuth` React Context.

- **📱 Step-by-Step Doctor-First Booking Flow & Mobile UX**
  - **Step 1: Doctor Roster Selection**: Patients pick their doctor first from interactive doctor cards displaying speciality, room number, visiting hours, and availability.
  - **Step 2: Touch-Friendly Booking Form**: Optimized for mobile devices with large touch targets, 3-pill gender buttons, responsive 2-column time slot grid, and sticky action buttons.
  - **Slim Mobile Chamber Bar**: Compact 1-line Currently Serving bar for small viewports.

- **⚡ Real-Time Background Queue Polling System**
  - Instant cross-device serial token synchronization between Mobile & Desktop without manual reloads.
  - Zero-flicker background polling at 10s intervals across Public Landing, Doctor Desk, and Receptionist Queue via **Zustand** store.

- **⏰ Admin Chamber Hours, Holidays & Global Kill-Switch**
  - Configure daily opening/closing hours (`chamberStartTime`, `chamberEndTime`) and weekly holidays (`offDays`).
  - One-click global booking status toggle (**OPEN** / **CLOSED**) to halt serial token issuance across the clinic.
  - Automatic landing page enforcement with custom notice banners explaining reopening times.

- **👨‍⚕️ Per-Doctor Schedules, Duration Pause Timers & Off-Days**
  - Admin can configure individual booking hours (e.g. `08:00 AM - 12:00 PM`) and weekly off-days per Doctor.
  - **Duration Pause Controls**: Admin can pause a doctor's serial booking with automated expiration timers:
    - ⏸️ `Pause 2 Hours` (auto-resumes after 2h)
    - ⏸️ `Pause 4 Hours` (auto-resumes after 4h)
    - ⏸️ `Pause Rest of Today` (auto-resumes next day)
    - ⏸️ `Pause OFF (Indefinite)`
    - ▶️ `Resume Booking`
  - Public booking form automatically displays doctor-specific pause countdowns & reopening times.

- **🩺 Interactive Prescription Generator & Lab Tests**
  - Dynamic prescription creation with real-time preview, lab tests ordering, and vitals tracking (BP, Pulse, Weight, Temp, SpO2).
  - Standardized dosage frequency formatting (e.g., `1+0+1`, `0+1+0`), duration, and instruction tags.
  - Strict price privacy: medical test prices are kept internal for billing and hidden from printed prescriptions.

- **🗑️ Admin Prescription Record Management & Deletion**
  - System-wide prescription archive with search, filter by doctor/status, inspection modal, and permanent record deletion (`DELETE /api/prescriptions/:id`).

- **💊 Offline Medicine Dictionary & Auto-Complete**
  - Ultra-fast client-side search across a **7.8MB local drug database** (`medicine.json`).
  - Support for custom clinic medicine additions with zero server overhead.

- **🖨️ Ultra-HD Print & Export Prescriptions**
  - One-click print layout and high-definition PNG ticket export powered by `html-to-image`.
  - Professional hospital OPD ticket and prescription sheet templates with clinic branding.

---

## 🏗️ Tech Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org) | SSR/SSG Routing & Application Core |
| **UI Library** | [React 19](https://react.dev) | Frontend Component Architecture |
| **Language** | [TypeScript 5](https://www.typescriptlang.org) | End-to-end Static Type Safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + `@tailwindcss/postcss` | Modern CSS Framework & Design Tokens |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs) + React Context | Client Queue State & Global Auth |
| **Icons** | [Lucide React](https://lucide.dev) | Modern Vector UI Icons |
| **Export Utility** | `html-to-image` | Canvas / Image Generation for RX & OPD Tickets |
| **Auth Cookies** | `js-cookie` | Client-Side Cookie Parsing & Storage |

---

## 📁 Directory Structure

```
patient-management-system-client/
├── app/                        # Next.js 16 App Router Directory
│   ├── admin/                  # Admin Dashboard & System Control Panel
│   ├── doctor/                 # Doctor Workspace & RX Consultation Desk
│   ├── receptionist/           # Receptionist Queue & Registration Desk
│   ├── login/                  # User Sign-in Page
│   ├── register/               # Doctor & User Registration Form
│   ├── track/                  # Public Live Queue Tracker Page
│   ├── layout.tsx              # Root Layout with Auth Provider
│   ├── page.tsx                # Mobile-First Public Landing Page & Booking UI
│   └── globals.css             # Tailwind v4 Styles & Custom Utilities
├── components/                 # Reusable UI & Feature Components
│   ├── AdminSidebar.tsx        # Admin Navigation Sidebar
│   ├── AppointmentBooking.tsx  # Patient Booking Wizard Modal
│   ├── ChamberScheduleSettings.tsx # Admin Chamber Hours & Holiday Control
│   ├── ClinicBrandingSettings.tsx # Clinic Branding Configuration
│   ├── DoctorDashboard.tsx     # Comprehensive Doctor Desk & RX Desk
│   ├── DoctorScheduleCard.tsx  # Admin Per-Doctor Schedule & Duration Pause Card
│   ├── DoctorSidebar.tsx       # Doctor Workspace Navigation
│   ├── MedicalTestManager.tsx  # Clinical Lab Tests Manager
│   ├── MedicineManager.tsx     # Custom Drug Dictionary Manager
│   ├── Navbar.tsx              # Header Navigation Bar
│   ├── PatientLiveTracker.tsx  # Real-time Public Serial Tracker Component
│   ├── PrescriptionsList.tsx   # Prescription History & Archive Viewer
│   ├── PrintablePrescription.tsx # Printable RX Sheet Template
│   ├── ProfileSettings.tsx     # User Profile & Password Updates
│   ├── PublicHomePageSettings.tsx # Landing Page Customization Panel
│   ├── QueueStatus.tsx         # Live Queue Management Desk
│   └── ReceptionistSidebar.tsx # Receptionist Workspace Navigation
├── hooks/                      # Custom React Hooks
│   ├── useAuth.tsx             # Global Auth & Role Checking Hook
│   ├── useClinicSetting.ts     # DB-Synced Clinic Settings Hook
│   └── useQueueStore.ts        # Zustand Real-time Queue Polling Store
├── lib/                        # Utility Functions & API Helpers
│   ├── api.ts                  # Centralized Fetch API Wrapper with Bearer Auth
│   └── dictionary-search.ts    # Fast Medicine Auto-complete Search Engine
├── public/                     # Static Assets & Images
├── medicine.json               # Full Local Medicine Dictionary (~7.8MB)
├── package.json                # Dependencies & Build Scripts
├── tsconfig.json               # TypeScript Configuration
└── next.config.ts              # Next.js Runtime Configuration
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** / **yarn** / **pnpm** / **bun**

### 2. Environment Configuration
Create a `.env.local` file in the `patient-management-system-client` root directory:

```env
# Backend API Base URL (Local Development)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# For Production (Vercel Deployment)
# NEXT_PUBLIC_API_URL=https://your-backend-api.vercel.app/api
```

### 3. Installation & Local Execution

```bash
# Navigate to client directory
cd patient-management-system-client

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Recent Updates & Changelog (August 21, 2026)

- ⚡ **Real-Time Polling Engine**: Added `startPolling(10000)` to `useQueueStore.ts` for instant serial updates across public, doctor, and receptionist views.
- 📱 **Mobile UX Overhaul**: 2-step booking flow (Select Doctor first → Fill Patient Info), pill gender toggles, slim chamber bar, and responsive touch targets.
- ⏰ **Chamber Hours & Holiday Control**: DB-backed `chamberStartTime`, `chamberEndTime`, `offDays`, and `bookingEnabled` kill-switch with admin controls.
- 👨‍⚕️ **Per-Doctor Duration Pause**: Added 2h, 4h, Rest of Today, and indefinite pause timers per doctor with automated reopening countdowns.
- 🗑️ **Prescription Delete API**: Admin can delete prescription records with confirmation modals (`DELETE /api/prescriptions/:id`).
- 🧪 **Lab Test Support**: Prescribe clinical lab tests with price privacy enforcement.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
