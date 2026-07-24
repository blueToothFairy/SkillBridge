import { CorsOptions } from 'cors';
import { config } from './env';

export const corsOptions: CorsOptions = {
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
