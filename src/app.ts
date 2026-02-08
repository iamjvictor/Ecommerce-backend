import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { router } from './routes/index';
import { errorMiddleware } from './middleware/error';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', router);

// Global Error Handler
app.use(errorMiddleware);

export { app };
