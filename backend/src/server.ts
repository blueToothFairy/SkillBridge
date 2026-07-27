import app from './app';
import { config } from './config/env';
import { logger } from './utils/logger';
import { runAcceptanceRemindersJob } from './utils/scheduler';

const server = app.listen(config.port, () => {
  logger.info(`Server is running on port ${config.port} [${config.nodeEnv}]`);
  
  // Set up the background scheduler for project acceptance reminders
  // Period: 2 minutes in development, 1 hour in production
  const schedulerIntervalMs = config.nodeEnv === 'production' ? 60 * 60 * 1000 : 2 * 60 * 1000;
  
  logger.info(`Initializing acceptance reminders scheduler (interval: ${schedulerIntervalMs / 1000}s)`);
  
  const intervalId = setInterval(async () => {
    try {
      const summary = await runAcceptanceRemindersJob();
      if (summary.remindersTriggered > 0) {
        logger.info(`[Scheduler Run] Checked ${summary.remindersChecked} reminders, triggered ${summary.remindersTriggered}.`);
      }
    } catch (err: any) {
      logger.error(`[Scheduler Error] failed execution: ${err.message}`);
    }
  }, schedulerIntervalMs);

  // Store on server object or context if needed to clean up during SIGTERM
  (server as any)._schedulerIntervalId = intervalId;
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  if ((server as any)._schedulerIntervalId) {
    clearInterval((server as any)._schedulerIntervalId);
    logger.info('Background scheduler cleared');
  }

  server.close(() => {
    logger.info('HTTP server closed');
  });
});
