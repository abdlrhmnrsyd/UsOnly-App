import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import { setupSocketHandlers } from './sockets/socketHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import spaceRoutes from './routes/spaceRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import memoryRoutes from './routes/memoryRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import milestoneRoutes from './routes/milestoneRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Allow development origins and mobile access
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

// Security headers with Helmet (configured for cross-origin resources like images)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => callback(null, true), // Flexible for dev & mobile testing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Rate limiter: 300 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari perangkat ini. Silakan coba lagi nanti.'
  }
});
app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Serve static upload directory
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Setup WebSocket events
setupSocketHandlers(io);
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Our Space API',
    time: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/space', spaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/pap', memoryRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/upload', uploadRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Terjadi kesalahan sistem internal.'
  });
});

// Start Server
server.listen(config.port, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`❤️  OUR SPACE SERVER RUNNING ON PORT ${config.port}`);
  console.log(`📡 Local: http://localhost:${config.port}`);
  console.log(`🔐 Mode: ${config.nodeEnv}`);
  console.log(`======================================================\n`);
});
