# GhostRoute

GhostRoute is a navigation-first mobile application that records real-world trips and provides live, passive efficiency analytics using personal route references.

The app is designed with the same safety posture as modern navigation apps (e.g., Waze and Google Maps). During navigation, GhostRoute may optionally display a small, non-interactive reference marker and an efficiency delta for situational awareness. All interpretation, comparisons, rewards, and insights are shown only after the drive is complete.

GhostRoute does **not** encourage racing, speeding, or competitive driving. Its purpose is to help users understand route consistency, efficiency, and improvement over time in a safe and privacy-respecting way.

---

## Core Principles

- **Navigation-first UX**
- **Low-distraction design**
- **Passive, informational live analytics**
- **Post-drive insights by default**
- **Explicit privacy controls**
- **App Store & Google Play compliant**

---

## Key Features

- Turn-by-turn navigation
- Session-based trip recording
- Route detection and normalization
- Personal route efficiency references (“ghosts”)
- Live efficiency delta (text-only, optional, non-interruptive)
- Post-drive trip summaries and analytics
- XP and progress tracking based on consistency and improvement (not speed)
- Friends-only sharing (no public route leaderboards in MVP)

---

## Safety & Compliance

GhostRoute follows a Waze-style safety posture:

- No racing or head-to-head driving mechanics
- No speed-based prompts or alerts
- No notifications requiring immediate action while driving
- No animated or gamified overlays during navigation
- Minimal, map-native UI elements only
- All competitive interpretation occurs post-drive

The app is explicitly designed to minimize cognitive load while driving.

---

## Privacy & Data Handling

- Location data is collected **only during active navigation sessions**
- No always-on or idle background tracking
- Default 90-day rolling retention for trip history
- Users can:
  - Delete individual trips
  - Delete all history
  - Export their data at any time
- Raw location data is minimized and never sold or shared with third parties

---

## Tech Stack

- **Mobile:** Flutter (iOS & Android)
- **Maps & Navigation:** Mapbox
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Notifications:** Post-drive only
- **Analytics:** First-party, privacy-minimized

---

## Repository Structure

