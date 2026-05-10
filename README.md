# Traveloop

Traveloop is a full-stack travel planning application for discovering cities, organizing trips, managing stops and activities, tracking budgets, keeping packing checklists, and writing trip notes. It is built with a React + Vite + Tailwind frontend, a Node.js + Express + TypeScript backend, PostgreSQL for persistent data, JWT authentication, Zod validation, and Socket.io for realtime experiences.

## Features

1. User registration and login with JWT authentication
2. Protected API routes for authenticated travelers
3. City discovery with seeded destination data
4. Activity browsing by city and activity type
5. Trip creation, editing, listing, and deletion
6. Ordered trip stops with arrival and departure dates
7. Stop-level activity planning and scheduling
8. Public trip sharing with generated public slugs
9. Trip budget tracking across transport, accommodation, meals, and miscellaneous costs
10. Packing checklist management with categories and packed status
11. Trip notes and journal entries
12. Realtime server support with Socket.io
13. Request validation with Zod schemas
14. In-memory API rate limiting for basic abuse protection

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- Axios
- Socket.io Client

### Backend

- Node.js
- Express
- TypeScript
- PostgreSQL
- Socket.io
- JWT
- Zod
- bcrypt
- pg

### Database

- PostgreSQL
- SQL migrations
- SQL seed data
- UUID support with `pgcrypto`

## Project Structure

```text
Odoo-2026/
+-- backend/
|   +-- src/
|   |   +-- controllers/
|   |   +-- database/
|   |   |   +-- migrations/
|   |   |   +-- seeds/
|   |   +-- middleware/
|   |   +-- routes/
|   |   +-- services/
|   |   +-- validators/
|   |   +-- server.ts
|   +-- package.json
+-- frontend/
|   +-- public/
|   +-- src/
|   +-- package.json
+-- SETUP.md
+-- README.md
```

## Installation

### Prerequisites

- Node.js 18 or newer
- npm
- PostgreSQL 14 or newer

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env` with your local PostgreSQL credentials and JWT secret.

Run the backend in development mode:

```bash
npm run dev
```

Build the backend:

```bash
npm run build
```

Start the compiled backend:

```bash
npm start
```

The backend runs on `http://localhost:5000` by default.

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

Run the frontend in development mode:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The frontend runs on `http://localhost:5173` by default.

## Environment Variables

### Backend `.env`

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=odoo_hackathon

JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env.local`

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Database Setup

Create the PostgreSQL database:

```bash
createdb odoo_hackathon
```

Run migrations from the backend directory:

```bash
cd backend
npx ts-node src/database/migrate.ts
```

Seed the database:

```bash
psql -U postgres -d odoo_hackathon -f src/database/seeds/002_seed.sql
```

If your PostgreSQL user, database name, host, or port differs, update `.env` first and adjust the `psql` command accordingly.

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/cities`
- `GET /api/activities`
- `GET /api/trips`
- `POST /api/trips`
- `GET /api/trips/:tripId/stops`
- `GET /api/trips/:tripId/budget`
- `GET /api/trips/:tripId/checklist`
- `GET /api/trips/:tripId/notes`
- `GET /api/public/:slug`
- `GET /health`

## Realtime

Traveloop initializes a Socket.io server alongside the Express HTTP server. The frontend can connect with `VITE_SOCKET_URL` to support realtime travel planning features such as collaborative trip updates, live notifications, or shared planning sessions.

## Validation And Security

- Zod schemas validate auth, trips, stops, activities, budgets, checklist items, and notes.
- JWT middleware protects private routes.
- Passwords are hashed with bcrypt.
- A dependency-free in-memory rate limiter limits each IP to 100 requests per 15 minutes.
- Centralized error handling returns consistent API responses.

## Team Members

- Shivam
- Divy
- Suthar
- Team Member 4

## Repository

https://github.com/suthardivy183-lang/Odoo-2026

## License

MIT
