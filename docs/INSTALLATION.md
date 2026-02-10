# Installation and Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Backend
1. `cd server`
2. `cp .env.example .env`
3. Configure `DATABASE_URL`.
4. Install deps: `npm install`
5. Run migrations: `npx prisma migrate dev`
6. Seed data: `npm run seed`
7. Start server: `npm run dev`

## Frontend
1. `cd web`
2. `cp .env.example .env`
3. Set `VITE_API_BASE_URL`.
4. Install deps: `npm install`
5. Start: `npm run dev`

## Environment Variables
Backend (`server/.env`):
- `DATABASE_URL`
- `PORT` (default 4000)
- `SESSION_SECRET`
- `CORS_ORIGIN`
- `GPS_BUFFER_METERS`
- `SESSION_TTL_DAYS`
- `RESET_TOKEN_TTL_MIN`
- `UPLOADS_DIR`

Frontend (`web/.env`):
- `VITE_API_BASE_URL`
- `VITE_ENABLE_PHOTO_CAPTURE` (true/false)

## Production
See `docs/DEPLOYMENT.md`.