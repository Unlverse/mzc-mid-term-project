# MZC Reservation MVP

MZC 단일 매장을 위한 예약 중심 MVP 프로젝트입니다.

프론트엔드는 `React + Vite`, 백엔드는 `NestJS`, 데이터베이스는 `MySQL`, ORM은 `Prisma`를 사용합니다.

## Stack

- Frontend: `React`, `Vite`, `react-router-dom`
- Backend: `NestJS`
- Database: `MySQL`
- ORM: `Prisma`
- Auth: `JWT`

## Folder Structure

```text
0. docs/    요구사항, DB, API, 구조 문서
backend/    NestJS API 서버
frontend/   React 고객/관리자 화면
```

## Core Features

### Customer
- 예약 가능 시간 조회
- 예약 생성
- 예약 조회
- 예약 취소

### Admin
- 관리자 로그인
- 예약 설정 조회/수정
- 예약 목록 조회
- 예약 상태 변경

## Main Routes

### Frontend
- `/`
- `/reservation`
- `/reservation/lookup`
- `/reservation/result`
- `/lookup`
- `/admin/login`
- `/admin/dashboard`

### Backend API
- `POST /api/admin/auth/login`
- `GET /api/reservations/available-times`
- `POST /api/reservations`
- `POST /api/reservations/lookup`
- `POST /api/reservations/cancel`
- `GET /api/admin/reservation-settings`
- `PUT /api/admin/reservation-settings`
- `GET /api/admin/reservations`
- `PATCH /api/admin/reservations/:reservationId/status`

## Backend Setup

```bash
cd backend
npm install
```

DB 반영

```bash
npm run prisma:push
npm run seed
```

서버 실행

```bash
npm run start:dev
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
