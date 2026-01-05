# Real-Time AI IoT — Elephant Detection & Acoustic Deterrent

## Project Overview

This repository implements a real-time elephant detection and acoustic deterrent system designed for Sri Lankan railways. The system uses trackside IoT devices to detect large-animal presence near railway tracks, notifies operators via a mobile dashboard, and can trigger deterrent audio to reduce collision risk.

## Key Features

- **Real-time alerts:** IoT-detected events generate immediate alerts and notifications to operators.
- **Mobile dashboard:** React Native app displays risk indicators, distance panels, and alert history.
- **User authentication:** Operator access control via Firebase Authentication.
- **Notification persistence:** Alerts are stored locally and synced to the backend for auditability.
- **Calibration & testing:** UI screens and utilities for on-site sensor calibration and testing.

## Architecture Overview

- **Backend:** Firebase (Authentication, Firestore) used for user management, event storage, and notification distribution.
- **Client:** React Native app providing UI components and operator workflows.

## Repository Structure (high level)

- `src/`
  - `components/` — UI pieces (e.g., `AlertCard`, `DistancePanel`, `RiskIndicator`)
  - `config/` — configuration (e.g., Firebase)
  - `context/` — `AuthContext` provider
  - `screens/` — app screens (`CalibrationScreen`, `DashboardScreen`, `FirstAlertsScreen`, `LoginScreen`, `ProfileScreen`)
  - `services/` — client-side services (authentication, location, notification storage/sync, etc.)
  - `utils/` — helper utilities (e.g., `haversine.js`)


## Setup (Developer)

Prerequisites:
- Node.js and npm
- React Native development Expo if used
- A Firebase project with Firestore and Authentication enabled

Install dependencies:

```bash
npm install

```

Configure Firebase:
- Add your Firebase config to `src/config/firebaseConfig.js` or follow the repo's config pattern.
- Enable Firestore and Authentication in the Firebase console.

## Running (Developer)

Start Metro and run on device:

```bash
npx expo start
(If using Expo):

