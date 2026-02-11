# API Documentation

Base URL: `/api`

## Auth
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /me`

## Admin
- `GET /admin/employees`
- `POST /admin/employees`
- `PATCH /admin/employees/:id`
- `PATCH /admin/employees/:id/deactivate`
- `GET /admin/attendance`
- `GET /admin/attendance/summary`
- `GET /admin/analytics`
- `GET /admin/locations`
- `POST /admin/locations`
- `PATCH /admin/locations/:id`
- `DELETE /admin/locations/:id`
- `GET /admin/locations/:id/assignments`
- `POST /admin/locations/:id/assignments`
- `GET /admin/assignments`
- `POST /admin/assignments`
- `DELETE /admin/assignments/:id`
- `GET /admin/employees/:id/locations`
- `GET /admin/shifts`
- `POST /admin/shifts`
- `POST /admin/shifts/bulk`
- `PATCH /admin/shifts/:id`
- `DELETE /admin/shifts/:id`
- `GET /admin/alerts`
- `GET /admin/export`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `POST /admin/settings/logo`

## Employee
- `GET /employee/attendance`
- `GET /employee/status`
- `POST /employee/clock-in`
- `POST /employee/clock-out`
- `POST /employee/break-start`
- `POST /employee/break-end`
- `GET /employee/export`

## Utilities
- `GET /health`
