# Traveloop

A full-stack travel planning app for the Odoo × Parul University Hackathon 2026.
Plan trips, build itineraries with stops and activities, track budget, manage
packing checklists, jot down notes, and share trips publicly via a slug URL.

Live updates are pushed over Socket.io so multiple clients viewing the same trip
stay in sync.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS 4 + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15 (UUID PKs, indexed FKs, `updated_at` triggers)
- **Real-time**: Socket.io (per-trip rooms)
- **Validation**: Zod on every endpoint
- **Auth**: JWT + bcrypt (12 salt rounds)

## Repository Layout

```
Odoo-2026/
├── backend/
│   ├── src/
│   │   ├── routes/         # express routers, mounted in server.ts
│   │   ├── controllers/    # parse req → call service → send response
│   │   ├── services/       # business logic + SQL
│   │   ├── validators/     # Zod schemas (one per resource)
│   │   ├── middleware/     # auth, error handler
│   │   ├── database/       # pool, migrations, seeds
│   │   └── server.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/          # one per route
│   │   ├── components/     # reusable UI (Navbar, Modal, TripCard, ...)
│   │   ├── context/        # AuthContext
│   │   ├── services/       # api.ts (axios), socket.ts
│   │   └── App.tsx         # route table
│   └── .env.example
└── README.md
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ running locally (or accessible via `DATABASE_URL`)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL and JWT_SECRET
npm install
npm run migrate     # creates schema (001_init.sql)
npm run seed        # loads 25 cities + 60 activities (002_seed.sql)
npm run dev         # starts http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # starts http://localhost:5173
```

Open http://localhost:5173, sign up, and start planning.

## API Surface

All `/api/trips/*` and nested routes require `Authorization: Bearer <jwt>`.

| Method | Path                                                | Purpose                              |
|--------|-----------------------------------------------------|--------------------------------------|
| POST   | `/api/auth/register`                                | Create account, returns JWT          |
| POST   | `/api/auth/login`                                   | Login, returns JWT                   |
| GET    | `/api/auth/me`                                      | Current user                         |
| GET    | `/api/trips` · `POST /api/trips`                    | List / create trips                  |
| GET/PUT/DELETE | `/api/trips/:id`                            | Trip CRUD (auto-creates budget row)  |
| GET/POST | `/api/trips/:id/stops` · `PATCH /reorder`         | Stops + reorder transaction          |
| PUT/DELETE | `/api/trips/:id/stops/:stopId`                  | Update / delete stop                 |
| GET    | `/api/cities` · `/api/cities/:id`                   | Browse cities + activities           |
| GET    | `/api/activities` (public)                          | Filter by city, type, cost range     |
| GET/POST/PUT/DELETE | `/api/trips/:id/stops/:stopId/activities` | Stop activities w/ effective cost    |
| GET/PUT | `/api/trips/:id/budget`                            | Breakdown + computed totals          |
| GET/POST/PUT/DELETE | `/api/trips/:id/checklist`             | Packing list + toggle endpoint       |
| GET/POST/PUT/DELETE | `/api/trips/:id/notes`                 | Notes (general or per stop)          |
| GET    | `/api/public/trips/:slug` (no auth)                 | Read-only shared itinerary           |

### Socket.io events

- `trip:join` / `trip:leave` (client → server) — join a trip's broadcast room
- `budget:updated` (server → room) — fired after every successful PUT to a trip's budget

## Frontend Routes

| Path                            | Auth | Page                      |
|---------------------------------|------|---------------------------|
| `/login`, `/signup`             | —    | Auth                      |
| `/dashboard`                    | ✓    | Stats + recent trips      |
| `/trips`                        | ✓    | All trips with filters    |
| `/trips/new`                    | ✓    | Create trip form          |
| `/trips/:id`                    | ✓    | Itinerary builder         |
| `/trips/:id/budget`             | ✓    | Donut chart + categories  |
| `/trips/:id/checklist`          | ✓    | Grouped packing list      |
| `/trips/:id/notes`              | ✓    | Notes with stop filters   |
| `/cities` · `/cities/:id`       | ✓    | Explore + city detail     |
| `/share/:slug`                  | —    | Public read-only trip     |

## Hackathon Constraints

- ✅ PostgreSQL only (no Firebase / Supabase)
- ✅ No third-party APIs
- ✅ Zod validation on every endpoint
- ✅ JWT authentication with bcrypt password hashing
- ✅ Real-time updates via Socket.io
- ✅ Indexed schema (38 indexes), FK cascades, `updated_at` triggers
- ✅ Modular routes / controllers / services / validators

## Repository

https://github.com/suthardivy183-lang/Odoo-2026
