import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors';
import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import tagRoutes from './modules/tags/tag.routes';
import projectRoutes from './modules/projects/project.routes';
import milestoneRoutes from './modules/milestones/milestone.routes';
import { sendError } from './utils/response';

const app: Application = express();

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/milestones', milestoneRoutes);

// Fallback 404 Route
app.use((_req: Request, res: Response) => {
  sendError(res, 'Route not found', 404, 'NOT_FOUND');
});

export default app;
