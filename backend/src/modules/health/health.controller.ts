import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response';

export class HealthController {
  public static getHealth(_req: Request, res: Response): void {
    const healthStatus = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'SkillBridge API',
    };

    sendSuccess(res, healthStatus);
  }
}
