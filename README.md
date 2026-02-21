# Ashiana PG Manager

A mobile-first web app for managing a paying guest (PG) accommodation — rooms, beds, tenants, and rent collection — built as a PWA so it installs directly on iOS/Android like a native app.

## Features

- **Room & bed overview** — floor-wise grid showing occupancy status (full / partial / empty) at a glance
- **New bookings** — assign a tenant to a bed with name, contact, rent, deposit, and joining date
- **Vacate flow** — mark a tenant as vacated with a vacate date; bed is freed immediately
- **Rent tracking** — per-tenant rent history, toggle paid/unpaid for any month
- **Monthly collections** — home screen strip shows this month's collected amount and paid count; tap "Details" for a full per-tenant list and month-by-month history
- **Bed defaults** — set a default rent per bed in Settings; new bookings pre-fill the rent field automatically
- **Bed & occupancy history** — see every past tenant for a bed and their payment record
- **Multi-admin** — invite other admins by email; all devices stay in sync via Firestore real-time updates
- **PWA** — installable on iOS and Android, works offline for reads

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + Tailwind CSS |
| Build | Vite |
| PWA | vite-plugin-pwa (Workbox) |
| Backend / DB | Firebase Firestore (real-time) |
| Auth | Firebase Authentication (Google Sign-In) |

## Getting Started

### Prerequisites
- Node.js 18+
- A Firebase project with Firestore and Google Auth enabled

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/gayathri-meka/ashiana-pg-manager.git
   cd ashiana-pg-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file at the project root and add your Firebase config:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_INITIAL_ADMIN_EMAIL=you@example.com
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Firestore Data Model

```
pgData/main
  rooms[]        — id, floor, totalBeds, beds[]
  beds[]         — id, occupied, tenantId, defaultRent
  tenants[]      — id, name, contact, rent, deposit, joiningDate,
                   vacateDate, active, roomId, bedId, rentHistory{}

admins/{email}   — addedBy, addedAt
```

## Project Structure

```
src/
  components/
    HomePage.jsx          # Room grid + collections strip
    RoomDetails.jsx       # Per-room bed cards
    NewBookingModal.jsx   # Book a bed
    VacateModal.jsx       # Mark tenant vacated
    RentHistoryModal.jsx  # Per-tenant rent & bed history
    CollectionsModal.jsx  # Monthly collections overview
    SettingsPage.jsx      # Admins + bed defaults
  data/
    initialRooms.js       # Room/bed seed data
  services/
    dataService.js        # Pure functions for bookBed, vacateBed, updateTenant
  utils/
    dateUtils.js          # Month range, formatting helpers
  context/
    AuthContext.jsx       # Firebase auth context
  App.jsx                 # Root — routing, Firestore sync, state
  firebase.js             # Firebase init
```
