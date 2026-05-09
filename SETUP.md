# Quick Start Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Initial Setup

### 1. Backend Setup

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Edit .env and set your PostgreSQL credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_NAME=odoo_hackathon
# JWT_SECRET=your_secure_key_here

# Install dependencies
npm install

# Start development server (runs on port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Copy environment variables (optional, defaults work for local dev)
cp .env.example .env.local

# Install dependencies
npm install

# Start development server (runs on port 5173)
npm run dev
```

## Database Setup

Before running the backend, ensure PostgreSQL is running and create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE odoo_hackathon;

# Exit
\q
```

## Architecture Overview

### Backend Structure
- `/routes` - API endpoints
- `/controllers` - Request handlers
- `/models` - Database models
- `/services` - Business logic
- `/middleware` - Express middleware (auth, error handling, logging)
- `/validators` - Zod schemas for input validation
- `/database` - Database connection and migrations

### Frontend Structure
- `/components` - Reusable React components
- `/pages` - Page components
- `/hooks` - Custom React hooks
- `/context` - React Context for state management
- `/services` - API and Socket.io clients
- `/utils` - Utility functions

## API Client Configuration

The frontend automatically:
- Attaches JWT tokens from localStorage to requests
- Handles 401 errors by redirecting to login
- Provides error responses with proper status codes

## Socket.IO Setup

Real-time features use Socket.IO:
- Automatically reconnects on disconnect
- Includes exponential backoff retry logic
- Ready for real-time updates, notifications, and live data

## Key Features Available

✅ JWT Authentication middleware
✅ Zod input validation
✅ Socket.IO integration
✅ Error handling middleware
✅ Logger utility
✅ CORS configured
✅ Environment-based configuration

## Common Commands

### Backend
```bash
npm run dev    # Development with hot reload
npm run build  # Build TypeScript to JavaScript
npm start      # Run compiled JavaScript
```

### Frontend
```bash
npm run dev    # Development server
npm run build  # Build for production
npm run preview # Preview production build
```

## Next Steps

1. **Define your data models** in `backend/src/models/`
2. **Create API endpoints** in `backend/src/routes/`
3. **Implement controllers** in `backend/src/controllers/`
4. **Build React components** in `frontend/src/components/`
5. **Add real-time features** using Socket.IO
6. **Deploy your solution**

## Troubleshooting

**Backend won't start?**
- Check PostgreSQL is running
- Verify .env file has correct DB credentials
- Ensure port 5000 is not in use

**Frontend can't connect to backend?**
- Verify backend is running on port 5000
- Check CORS configuration in backend
- Verify VITE_API_URL in frontend .env.local

**Database connection error?**
- Verify PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Verify credentials in .env match PostgreSQL setup

## Support

For hackathon-specific questions, refer to the Odoo Hackathon participant document or contact through the hackathon portal Helpdesk.
