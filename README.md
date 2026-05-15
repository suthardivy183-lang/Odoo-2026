<div align="center">

# ✈️ Traveloop

### Real-Time Collaborative Travel Planning Platform

*Built for the Odoo × Parul University Hackathon 2026*

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169e1?style=flat-square&logo=postgresql)](https://postgresql.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socket.io)](https://socket.io)

</div>

---

## Overview

**Traveloop** is a full-stack, real-time travel planning application that lets individuals and groups plan, organize, and collaborate on trips from a single unified platform. From building multi-stop itineraries and optimizing routes to splitting expenses and tracking budgets — every feature is designed to eliminate travel planning friction.

Live updates are pushed over Socket.io, so all collaborators viewing the same trip see changes instantly with no page refresh.

---

## Features

### Core Planning
| Feature | Description |
|---|---|
| 🗺️ **Multi-stop Itineraries** | Build ordered trip stops with arrival/departure dates and notes |
| 📅 **Calendar & List Views** | Visualize your trip day-by-day or as a scrollable list |
| 🗓️ **Date Conflict Detection** | Prevents overlapping stops with real-time validation |
| 🏙️ **City Discovery** | Browse 25+ seeded destinations with popularity scores and cost indices |
| 🎯 **Activity Planning** | Add activities per stop with scheduling, duration, and cost tracking |

### Routing & Maps
| Feature | Description |
|---|---|
| 📍 **Interactive Map** | Live route visualization using OpenStreetMap (no API key required) |
| 📏 **Distance & Travel Time** | Haversine great-circle distance + estimated flight time between stops |
| 🔀 **Route Optimization** | Nearest-neighbor + 2-opt algorithm minimizes total travel distance |
| 🗺️ **Maps Export** | One-click export to Google Maps or Apple Maps |

### Budget & Finance
| Feature | Description |
|---|---|
| 💰 **Unified Budget Dashboard** | Donut chart aggregating activities, lodging, reservations, meals, and expenses |
| 🏨 **Lodging Management** | Track nightly rates, check-in/out dates auto-calculated |
| 🎫 **Reservation Tracking** | Log flights, hotels, trains, car rentals with booking references |
| 💸 **Group Expense Splitting** | Split costs across trip members with balance tracking |
| 💱 **Multi-Currency Support** | 40+ ISO 4217 currencies with exchange rate conversion |

### Collaboration & Organization
| Feature | Description |
|---|---|
| ⚡ **Real-Time Sync** | Socket.io per-trip rooms broadcast every change instantly |
| 👥 **Trip Members** | Invite collaborators with editor roles |
| ✅ **Packing Checklists** | Grouped checklist with packed/unpacked status |
| 📝 **Trip Notes** | Rich notes per trip or per stop |
| 🌐 **Public Sharing** | Share read-only trip itineraries via generated slug URLs |

---

## Tech Stack

```
Frontend                    Backend                     Infrastructure
─────────────────────────   ─────────────────────────   ──────────────────
React 19 + Vite             Node.js 20 + Express        PostgreSQL 15
TypeScript 5                TypeScript 5                38 indexes
Tailwind CSS 4              Zod (all endpoints)         FK cascades
React Router 6              JWT + bcrypt (12 rounds)    updated_at triggers
React Leaflet               Socket.io rooms             UUID primary keys
Axios + interceptors        Rate limiter (100/15min)    Transaction support
```

---

## Architecture

```
Odoo-2026/
├── backend/
│   ├── src/
│   │   ├── routes/          # Express routers mounted in server.ts
│   │   ├── controllers/     # Request parsing → service call → response
│   │   ├── services/        # Business logic + SQL queries
│   │   ├── validators/      # Zod schemas (one per resource)
│   │   ├── middleware/      # JWT auth, error handler, rate limiter
│   │   ├── database/        # Connection pool, migrations, seeds
│   │   └── server.ts        # App entry, Socket.io setup, route mounting
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # One component per route
│   │   ├── components/      # Navbar, Modal, TripCard, CityCard
│   │   ├── context/         # AuthContext (JWT token management)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # api.ts (Axios), socket.ts (Socket.io client)
│   │   └── App.tsx          # Route table + protected route wrapper
│   └── .env.example
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (local or remote via `DATABASE_URL`)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET in .env

npm install
npm run migrate     # Runs all SQL migrations in order
npm run seed        # Seeds 25 cities, 60 activities, lodging options
npm run dev         # API server → http://localhost:3001
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001

npm install
npm run dev         # Dev server → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173), register an account, and start planning.

---

## API Reference

> All `/api/trips/*` routes require `Authorization: Bearer <token>`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register and receive JWT |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Fetch current user profile |
| `POST` | `/api/auth/forgot-password` | Generate password reset token |
| `POST` | `/api/auth/reset-password` | Reset password with token |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET / POST` | `/api/trips` | List or create trips |
| `GET / PUT / DELETE` | `/api/trips/:id` | Read, update, or delete a trip |
| `GET / POST` | `/api/trips/:id/stops` | List or add stops |
| `PUT / DELETE` | `/api/trips/:id/stops/:stopId` | Update or remove a stop |
| `POST` | `/api/trips/:id/stops/reorder` | Reorder stops (transactional) |
| `POST` | `/api/trips/:id/stops/optimize` | Run route optimization |

### Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET / PUT` | `/api/trips/:id/budget` | View or update budget breakdown |
| `GET / POST / DELETE` | `/api/trips/:id/expenses` | Group expense tracking |
| `GET / POST / PUT / DELETE` | `/api/trips/:id/reservations` | Flight, hotel, train reservations |
| `GET / POST / PUT / DELETE` | `/api/trips/:id/lodgings` | Accommodation bookings |
| `GET / POST / PUT / DELETE` | `/api/trips/:id/checklist` | Packing checklist items |
| `GET / POST / PUT / DELETE` | `/api/trips/:id/notes` | Trip notes and journal |
| `GET / POST / DELETE` | `/api/trips/:id/members` | Trip collaborators |

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cities` | Browse cities with filters |
| `GET` | `/api/cities/:id` | City detail with activities |
| `GET` | `/api/activities` | Filter activities by city, type, cost |
| `GET` | `/api/public/trips/:slug` | Public read-only trip view (no auth) |

### Real-Time Events (Socket.io)
| Event | Direction | Description |
|-------|-----------|-------------|
| `trip:join` | Client → Server | Subscribe to a trip's broadcast room |
| `trip:leave` | Client → Server | Unsubscribe from a trip room |
| `budget:updated` | Server → Room | Fires after any budget change |
| `expenses:updated` | Server → Room | Fires after any expense change |

---

## Frontend Routes

| Path | Auth | Page |
|------|------|------|
| `/login` · `/signup` | Public | Authentication |
| `/dashboard` | ✓ | Stats overview + recent trips |
| `/trips` | ✓ | Full trip list with filters |
| `/trips/new` | ✓ | Trip creation wizard |
| `/trips/:id` | ✓ | Itinerary builder (map, calendar, list) |
| `/trips/:id/budget` | ✓ | Budget dashboard with donut chart |
| `/trips/:id/reservations` | ✓ | Flight, hotel & transport reservations |
| `/trips/:id/checklist` | ✓ | Grouped packing list |
| `/trips/:id/notes` | ✓ | Notes with stop-level filtering |
| `/cities` · `/cities/:id` | ✓ | Destination explorer |
| `/share/:slug` | Public | Read-only shared itinerary |

---

## Hackathon Compliance

| Requirement | Status |
|---|---|
| PostgreSQL only (no Firebase / Supabase / external DBs) | ✅ |
| No third-party paid APIs | ✅ |
| Zod input validation on every endpoint | ✅ |
| JWT authentication with bcrypt (12 salt rounds) | ✅ |
| Real-time updates via Socket.io | ✅ |
| Optimized schema — 38 indexes, FK cascades, `updated_at` triggers | ✅ |
| Modular architecture: routes → controllers → services → validators | ✅ |
| Rate limiting — 100 requests / 15 min per IP | ✅ |
| TypeScript across the full stack | ✅ |

---

## Team

| Name | Role |
|------|------|
| **Shivam** | Full-Stack Developer |
| **Divy** | Full-Stack Developer |

---

## Repository

[https://github.com/suthardivy183-lang/Odoo-2026](https://github.com/suthardivy183-lang/Odoo-2026)

---

<div align="center">

Made with ☕ and ✈️ for **Odoo × Parul University Hackathon 2026**

</div>
