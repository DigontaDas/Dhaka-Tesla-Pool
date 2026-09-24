import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import areasRoutes from './modules/areas/areas.routes.js';
import ridesRoutes from './modules/rides/rides.routes.js';
import driversRoutes from './modules/drivers/drivers.routes.js';
import ratingsRoutes from './modules/ratings/ratings.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow local frontend and test clients
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root health check endpoint (for Render & browser status verification)
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'oi-tesla-backend',
    version: '1.0.0',
    message: '⚡ Oi Tesla Backend Engine Roaring Online',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (PRD requirement)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'oi-tesla-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Root API welcome
app.get('/api', (req, res) => {
  res.json({
    message: 'Oi Tesla - Dhaka Electric Micro-Pool API',
    version: '1.0.0',
    cast: {
      driver: 'Jashim Uddin (Bullet, 3-seat Tesla e-trike)',
      passengers: ['Nusrat Jahan', 'Rafiq Ahmed', 'Shirin Akter'],
    },
    documentation: '/api/docs',
  });
});

// Mount modules
app.use('/api/auth', authRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/ratings', ratingsRoutes);

// Error Handling
app.use(errorHandler);

// Only listen if run directly (allows supertest in tests without port conflicts)
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`⚡ Oi Tesla backend engine roaring on http://localhost:${env.PORT}`);
    console.log(`⚡ Mode: ${env.NODE_ENV}`);
    console.log(`⚡ Story cast seeded & ready: Jashim (Bullet), Nusrat, Rafiq, Shirin`);
  });
}

export default app;
