import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import rateLimiter from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { testConnection } from './database/pool';

dotenv.config();

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
});

// Make io accessible to controllers via app.get('io')
app.set('io', io);

// Middleware
app.use(cors(corsOptions));
app.use(rateLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (_req, res) => {
  res.json({
    name: 'Traveloop API',
    status: 'ok',
    health: '/health',
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
import authRoutes from './routes/auth.routes';
import tripRoutes from './routes/trip.routes';
import stopRoutes from './routes/stop.routes';
import cityRoutes from './routes/city.routes';
import { activityRouter, stopActivityRouter } from './routes/activity.routes';
import budgetRoutes from './routes/budget.routes';
import checklistRoutes from './routes/checklist.routes';
import notesRoutes from './routes/notes.routes';
import memberRoutes from './routes/member.routes';
import expenseRoutes from './routes/expense.routes';
import publicRoutes from './routes/public.routes';
app.use('/api/auth',                                          authRoutes);
app.use('/api/trips',                                         tripRoutes);
app.use('/api/trips/:tripId/stops',                           stopRoutes);
app.use('/api/cities',                                        cityRoutes);
app.use('/api/activities',                                    activityRouter);
app.use('/api/trips/:tripId/stops/:stopId/activities',        stopActivityRouter);
app.use('/api/trips/:tripId/budget',                          budgetRoutes);
app.use('/api/trips/:tripId/checklist',                       checklistRoutes);
app.use('/api/trips/:tripId/notes',                           notesRoutes);
app.use('/api/trips/:tripId/members',                         memberRoutes);
app.use('/api/trips/:tripId/expenses',                        expenseRoutes);
app.use('/api/public',                                        publicRoutes);

// Socket.IO events — clients join trip-scoped rooms to receive live updates
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('trip:join', (tripId: string) => {
    if (typeof tripId === 'string' && tripId.length > 0) {
      socket.join(`trip:${tripId}`);
    }
  });

  socket.on('trip:leave', (tripId: string) => {
    if (typeof tripId === 'string' && tripId.length > 0) {
      socket.leave(`trip:${tripId}`);
    }
  });

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  try {
    await testConnection();
  } catch (err) {
    logger.error(
      'PostgreSQL connection failed. API routes that use the database will fail until PostgreSQL is running.',
      err
    );
  }
});
