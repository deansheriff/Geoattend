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
- `GET /admin/employees/:id/locations`

## Employee
- `GET /employee/attendance`
- `GET /employee/status`
- `POST /employee/clock-in`
- `POST /employee/clock-out`
- `POST /employee/break-start`
- `POST /employee/break-end`

## Utilities
- `GET /health`