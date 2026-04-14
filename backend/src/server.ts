import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import prisma from './config/prisma';
import gigRoutes from './routes/gigs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/gigs', gigRoutes);

// Health Check
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong 🏓');
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 LocalGigs Server running on http://localhost:${PORT}`);
});