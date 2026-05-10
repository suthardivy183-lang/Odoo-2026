import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { testConnection } from './database/pool';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
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
app.use('/api/auth',                                          authRoutes);
app.use('/api/trips',                                         tripRoutes);
app.use('/api/trips/:tripId/stops',                           stopRoutes);
app.use('/api/cities',                                        cityRoutes);
app.use('/api/activities',                                    activityRouter);
app.use('/api/trips/:tripId/stops/:stopId/activities',        stopActivityRouter);
app.use('/api/trips/:tripId/budget',                          budgetRoutes);
app.use('/api/trips/:tripId/checklist',                       checklistRoutes);

// Socket.IO events
io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  await testConnection();
});
