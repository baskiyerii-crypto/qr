# API Özeti

Base URL: `/api`

## Auth
- `POST /auth/register` — Şirket kaydı
- `POST /auth/login` — Giriş
- `POST /auth/refresh` — Token yenileme
- `POST /auth/accept-invite` — Personel davet

## Companies
- `GET /companies/me`
- `GET /companies/qr` — QR PNG data URL
- `GET/POST /companies/branches`
- `GET/POST /companies/departments`

## Employees
- `GET/POST /employees`
- `GET /employees/live`

## Attendance
- `POST /attendance/check` — QR giriş/çıkış
- `GET /attendance/my`
- `GET /attendance`
- `POST /attendance/manual`

## Shifts, Leaves, Timesheets, Tasks, Announcements, Messages, Payroll, KVKK, Dashboard

Detaylı endpoint listesi kaynak kodda modül controller'larında tanımlıdır.

## Auth Header

```
Authorization: Bearer <access_token>
```
