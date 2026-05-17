# Contributing to Traveloop

## Getting Started

```bash
# Clone the repo
git clone https://github.com/suthardivy183-lang/Odoo-2026.git
cd Odoo-2026

# Install all dependencies
npm run install:all

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env with your PostgreSQL credentials

# Run migrations + seed data
npm run migrate
npm run seed

# Start development servers
npm run dev:backend   # → http://localhost:3001
npm run dev:frontend  # → http://localhost:5173
```

## Project Structure

```
backend/src/
  routes/       → Express routers
  controllers/  → Request handlers (thin layer)
  services/     → Business logic + SQL
  validators/   → Zod schemas (one per resource)
  middleware/   → Auth, error handler, rate limiter
  database/     → Pool, migrations (SQL), seed

frontend/src/
  pages/        → One component per route
  components/   → Reusable UI (Navbar, Modal, TripCard)
  services/     → api.ts (Axios), socket.ts
  context/      → AuthContext
```

## Code Standards

- **TypeScript** — strict mode, no `any` unless unavoidable
- **Zod** — every API endpoint must validate with a Zod schema
- **Services** — all business logic stays in `services/`, controllers only parse + respond
- **SQL** — raw SQL via `pg` pool, no ORM
- **Commits** — use imperative mood: `add`, `fix`, `remove`, `refactor`

## Database Migrations

Add new migration files in `backend/src/database/migrations/` with the next sequential number:

```
009_your_feature.sql
```

Always use `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`.

## Environment Variables

Never commit `.env` files. Use `.env.example` as the template.
