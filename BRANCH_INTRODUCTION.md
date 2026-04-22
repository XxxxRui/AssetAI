# Branch Report

## 1. Branch Overview

This branch documents my milestone contributions to the AssetGuard project, focused on frontend-backend integration, database runtime readiness, and local development workflow automation.  
The core objective of this stage was to move the project from a static UI demo to a runnable, testable, and demonstrable system.

---

## 2. Background and Problems

At the beginning of this stage, the project had several common issues:

- The frontend was mostly static; key buttons were visible but not connected to real business logic.
- Backend APIs existed, but local setup steps were fragmented and relied on manual execution.
- Database migration and seed workflows had no unified entry point, causing first-run failures such as missing tables or unavailable data.
- Local frontend-backend integration was unstable, affecting authentication testing and feature demos.

These issues increased the local onboarding barrier and reduced delivery and demo efficiency.

---

## 3. Stage Objectives

This branch was developed around the following objectives:

1. Build a stable one-click startup and first-run initialization workflow.  
2. Connect frontend authentication to real backend API calls.  
3. Ensure database migration and seed workflows are repeatable and reliable.  
4. Fix critical UI interaction issues so the system can be demonstrated effectively.  
5. Improve user-context consistency in the frontend (show real logged-in user information).

---

## 4. Main Implementation Work

### 4.1 Local Startup Workflow Engineering

Added and iterated Windows startup scripts:

- `start-dev.ps1`
- `start-dev.bat`

Key outcomes:

- Automatically checks and uses the backend virtual environment (creates it if needed).
- Automatically installs dependencies.
- Automatically runs database migration (`flask db upgrade`).
- Automatically runs seed on first run.
- Starts both backend and frontend services from a single entry point.

This significantly reduced manual command errors and environment inconsistency risks.

### 4.2 Database Runtime Readiness Improvements

Work completed to improve database availability:

- Standardized migration execution order so schema is ready before service runtime.
- Integrated seed execution into startup flow to ensure accounts and sample data are available.
- Addressed common failures where services run but database initialization is incomplete.

These changes improved backend/database reliability and reproducibility in local development.

### 4.3 Frontend-Backend Authentication Integration

Connected frontend pages with backend auth APIs to enable real authentication flow:

- Login endpoint: `POST /api/v1/auth/login`
- First-login password setup endpoint: `POST /api/v1/auth/set-initial-password`

Implemented state-driven page transitions based on backend response:

- `login -> password setup -> dashboard`

This upgraded the system from a static login page to an auth-driven UI flow.

### 4.4 Frontend Interaction Fixes and UX Improvements

Completed key interaction fixes in dashboard views:

- Sidebar navigation now supports click-based switching with active-state feedback.
- Topbar user text changed from static placeholder to logged-in user email.
- Improved behavioral consistency and demo readability.

---

## 5. Key Issues and Solutions

During integration, the following issues were prioritized:

- Request failure (`Failed to fetch`) blocked login flow.
- Python environment and dependency source inconsistencies in local startup.
- Seeding before migration caused missing-table errors.

Applied solutions:

- Adjusted local frontend-backend communication strategy to stabilize API request routing.
- Encoded environment checks, dependency installation, and migration order in scripts.
- Separated first-run and normal-run behavior to reduce repeat-operation risks.

---

## 6. Stage Outcomes

This branch delivers a directly demonstrable baseline workflow:

**Login -> First-Login Password Setup (if required) -> Enter Dashboard**

Engineering-level value delivered:

- Lowered local startup barrier for team members.
- Improved backend/database runtime stability.
- Increased frontend-backend integration efficiency.
- Established a reusable foundation for future feature development.

