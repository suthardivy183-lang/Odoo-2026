# Odoo Hackathon 2026

A full-stack solution for the Odoo Hackathon 2026, built with React, Node.js, and PostgreSQL.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL
- **Real-time**: Socket.io
- **Validation**: Zod
- **Authentication**: JWT

## Project Structure

```
Odoo-2026/
├── backend/          # Express server with TypeScript
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── database/
│   │   └── server.ts
│   └── package.json
├── frontend/         # React app with Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your environment variables (PostgreSQL credentials, JWT secret, etc.)

4. Install dependencies:
```bash
npm install
```

5. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Create `.env.local` file:
```bash
cp .env.example .env.local
```

3. Install dependencies:
```bash
npm install
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Development

Both frontend and backend support hot reloading during development.

### Backend Development
- TypeScript compilation with strict mode
- Automatic restart with nodemon
- Socket.io for real-time features

### Frontend Development
- Vite for fast module replacement
- TypeScript for type safety
- Modular component structure

## Features

- **Authentication**: JWT-based user authentication
- **Real-time Updates**: Socket.io for real-time data synchronization
- **Input Validation**: Zod schema validation
- **Error Handling**: Centralized error handling middleware
- **Modular Architecture**: Clean separation of concerns

## Key Constraints

- ✅ PostgreSQL (no Firebase/Supabase)
- ✅ Minimal third-party APIs
- ✅ Real-time and dynamic data
- ✅ Robust input validation
- ✅ JWT authentication
- ✅ Proper database indexing

## Evaluation Criteria

This solution is built to excel in:
- Coding standards and patterns
- Logic and debugging
- Modularity and architecture
- Database design
- Frontend design and UX
- Performance and scalability
- Security
- Usability

## Team Information

- **Repository**: https://github.com/suthardivy183-lang/Odoo-2026
- **Team Leader**: To be confirmed on hackathon portal

## License

MIT
