# Deployment Guide

## Backend
- Build: `npm run build`
- Start: `npm run start`
- Use a process manager (PM2, systemd, or container).
- Set `NODE_ENV=production`.
- Enforce HTTPS behind a proxy (NGINX).

## Database
- Use managed PostgreSQL with automated backups.
- Enable SSL connections.

## Frontend
- Build: `npm run build`
- Serve with a CDN or static host.

## Security
- Set strong secrets and rotate regularly.
- Enable rate limiting and CORS.
- Keep dependencies patched.