# AssetGuard AI - GitHub Wiki Draft

This document contains ready-to-paste content for your GitHub Wiki.

Suggested pages:

1. `Home`
2. `Quick-Start`
3. `System-Architecture`
4. `Backend-API`
5. `Frontend-Guide`
6. `Development-Workflow`
7. `Troubleshooting`

---

## Page: Home

```md
# AssetGuard AI

AssetGuard AI is an asset safety and load-compliance platform with:

- A Flask backend (`AssetGuard AI`) for auth, assets, evaluations, and alerts
- A React + Vite frontend (`assetguard-ui`) for operational workflows
- An optional extraction tool (`gjp-assetguard-extraction-tool`) that converts engineering documents into JSON payloads

## Core Capabilities

- Role-based access control (`System_Admin`, `Asset_Manager`, `Contractors`)
- Location and asset management
- Load-capacity modeling and compliance evaluation
- Evaluation history tracking
- Alert preferences and communication logs
- Batch import of AI-generated asset JSON data

## Repository Structure

- `AssetGuard AI/` - Flask backend service
- `assetguard-ui/` - Frontend application
- `gjp-assetguard-extraction-tool/` - External AI extraction pipeline
- `start-dev.ps1` / `start-dev.sh` - One-command local bootstrap

## Next

- Start here: [[Quick-Start]]
- Understand internals: [[System-Architecture]]
- Integrate APIs: [[Backend-API]]
```

---

## Page: Quick-Start

```md
# Quick Start

## Prerequisites

- Python 3.11+
- Node.js 18+
- npm

## Recommended (one command)

From repository root:

- Windows PowerShell: `./start-dev.ps1`
- macOS/Linux: `./start-dev.sh`

This starts backend + frontend in separate terminals and runs bootstrap steps.

## Manual Start

### Backend (`AssetGuard AI`)

```bash
cd "AssetGuard AI"
python -m venv .venv
# Windows: .\.venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
python -m pip install -r requirements.txt
python -m flask --app assetguard_app.py db upgrade
python -m flask --app assetguard_app.py seed
python -m flask --app assetguard_app.py run --port 5000
```

Backend base URL: `http://127.0.0.1:5000/api/v1`

### Frontend (`assetguard-ui`)

```bash
cd "assetguard-ui"
npm install
npm run dev
```

Frontend URL: Vite default (normally `http://127.0.0.1:5173`)

## Demo Accounts

- `admin@demo.com` / `admin123` (`System_Admin`)
- `manager@demo.com` / `manager123` (`Asset_Manager`)
- `contractor@demo.com` / `contractor123` (`Contractors`)
```

---

## Page: System-Architecture

```md
# System Architecture

## High-Level Components

1. **Frontend (`assetguard-ui`)**
   - React UI for login, dashboard, assets, history, alerts, and admin pages
2. **Backend (`AssetGuard AI`)**
   - Flask REST APIs
   - SQLAlchemy models + Alembic migrations
   - RBAC and evaluation logic
3. **Extraction Tool (`gjp-assetguard-extraction-tool`)**
   - Converts docs/images to asset JSON payloads
   - Outputs JSON files for backend import

## Backend Layering

- `controllers` - HTTP route handlers and input parsing
- `services` - business logic
- `models` - persistence models
- `utils` - auth, responses, error handling

## Main Data Flow

1. User logs in and receives bearer token.
2. Frontend sends token with API requests.
3. Backend validates token and role permissions.
4. Evaluation endpoint compares requested load against stored capacity.
5. Results are persisted and available in history/dashboard views.

## Import Flow (AI to Main DB)

1. Extraction tool writes JSON files to uploads directory.
2. Admin calls `POST /api/v1/assets/import-json-uploads`.
3. Backend validates payloads and imports valid assets/capacities.
4. Response includes success and rejection summary per file.
```

---

## Page: Backend-API

```md
# Backend API

Base path: `/api/v1`

## Auth

- `POST /auth/login`
- `POST /auth/set-initial-password`
- `POST /auth/change-password`
- `POST /auth/users` (admin only)

## Locations

- `GET /locations/` (authenticated)
- `POST /locations/` (`System_Admin`, `Asset_Manager`)

## Assets

- `GET /assets/?locationId=...`
- `GET /assets/all`
- `POST /assets/` (`System_Admin`, `Asset_Manager`)
- `POST /assets/import-json-uploads` (`System_Admin`)
- CRUD for load capacities under `/assets/<id>/load-capacities`

## Evaluations

- `GET /evaluations/equipment-options`
- `POST /evaluations/check`
- `GET /evaluations/history` (`System_Admin`, `Asset_Manager`)

## Health

- `GET /health`

## Auth Header

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## Notes

- Standard success shape: `{ "success": true, "data": ... }`
- Standard error shape: `{ "success": false, "message": "...", "code": "..." }`
- Full endpoint examples: see repository file `AssetGuard AI/API_DOCUMENTATION.md`
```

---

## Page: Frontend-Guide

```md
# Frontend Guide

Tech stack:

- React
- Vite
- ESLint

## Main Entry

- `src/App.jsx` controls session state and page switching
- `src/components/layout` contains shared shell components (sidebar, topbar)

## Key Pages

- `LoginEmailPage` - user sign-in
- `PasswordSetupPage` - first-login password setup
- `DashboardPage` - navigation hub
- `AssetsPage`, `HistoryPage`, `EvaluationPage`, `AlertsPage`
- `AdminUsersPage`, `AdminLocationPage`

## API Integration

- `src/services/apiClient.js` handles request wrapper and unauthorized handling
- `src/services/authSession.js` stores runtime auth token and unauthorized callback

## Local Dev

```bash
cd assetguard-ui
npm install
npm run dev
```
```

---

## Page: Development-Workflow

```md
# Development Workflow

## Branching

- Create feature branches from `main`
- Do not push directly to `main`
- Keep commits focused and small

## Recommended Steps

1. `git checkout main && git pull`
2. `git checkout -b feature/<name>`
3. Implement and test
4. `git status` + `git diff` review
5. Commit with clear message
6. Open PR

## Backend Test

```bash
cd "AssetGuard AI"
python -m unittest tests.test_api_flow -v
```

## Security Hygiene

- Never commit `.env`
- Never commit credentials JSON
- Keep separate virtual environments per subproject
```

---

## Page: Troubleshooting

```md
# Troubleshooting

## Backend fails to start

- Verify venv exists and dependencies installed
- Run migrations explicitly:
  - `python -m flask --app assetguard_app.py db upgrade`

## Login fails with 401

- Check seeded users exist
- Re-run seed in backend project:
  - `python -m flask --app assetguard_app.py seed`

## Frontend cannot call backend

- Confirm backend running on `127.0.0.1:5000`
- Confirm frontend uses correct API base URL
- Check browser network errors and CORS headers

## Import JSON returns rejected files

- Validate JSON shape:
  - `locationName`
  - `name`
  - `loadCapacities[]`
- Ensure capacity name and metric pairs are valid
```

---

## Optional Wiki Sidebar

Create a page named `_Sidebar`:

```md
### AssetGuard AI Wiki

- [[Home]]
- [[Quick-Start]]
- [[System-Architecture]]
- [[Backend-API]]
- [[Frontend-Guide]]
- [[Development-Workflow]]
- [[Troubleshooting]]
```
