# Sherpackage Attendance (GeoAttend)

Location-based attendance management system with geofencing, admin analytics, and mobile-first employee clock-in/out.

## Stack
- Frontend: React + Vite + Tailwind + Leaflet
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL

## Quick Start
1. Backend
   - `cd server`
   - `cp .env.example .env`
   - Set `DATABASE_URL` to your Postgres instance.
   - `npm install`
   - `npx prisma migrate dev`
   - `npm run seed`
   - `npm run dev`

2. Frontend
   - `cd web`
   - `cp .env.example .env`
   - Set `VITE_API_BASE_URL` (default: http://localhost:4000).
   - `npm install`
- `npm run dev`

## Docker (Production-like)
This repo includes a Docker Compose setup suitable for Coolify.

1. From the repo root, build and run:
```bash
docker compose up -d --build
```

2. Open the app at `http://localhost:8080`.

### Coolify Notes
- Use a single domain: `geoattend.sherpackage.com`.
- Route everything to the `web` service (Nginx). It proxies `/api` and `/uploads` to the backend.
- No separate API subdomain is required.

Default seed users:
- Admin: `admin@geoattend.local` / `Admin123!`
- Employee: `employee@geoattend.local` / `Employee123!`

## Docs
- Installation: `docs/INSTALLATION.md`
- Admin Guide: `docs/ADMIN_GUIDE.md`
- Employee Guide: `docs/EMPLOYEE_GUIDE.md`
- API: `docs/API.md`
- Deployment: `docs/DEPLOYMENT.md`

## Notes
- Geofencing uses the Haversine formula plus a GPS accuracy buffer (default 20 meters).
- Times are stored in UTC; per-user time zones are supported.
- Photo capture is optional and can be enabled in the frontend.

## Bootstrap Admin (if login fails)
If the seed didn’t run or you need a first admin, use the bootstrap endpoint once.

1. Set `BOOTSTRAP_TOKEN` in `docker-compose.yaml` or your environment.
2. Call:
```bash
curl -X POST https://geoattend.sherpackage.com/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-token: YOUR_TOKEN" \
  -d '{"email":"admin@geoattend.local","name":"Admin","password":"Admin123!"}'
```

This only works when no users exist yet.

## Temporary Open Admin Page
If you need a one-time admin without auth:
1. Set `ENABLE_ADMIN_CREATE=true` on the server.
2. Visit `/admin-create-open` and create an admin.
3. Set `ENABLE_ADMIN_CREATE=false` and remove the page.
