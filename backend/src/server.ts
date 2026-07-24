import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port} [${config.nodeEnv}]`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
