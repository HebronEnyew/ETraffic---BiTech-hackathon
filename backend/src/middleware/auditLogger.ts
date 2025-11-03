import { Request, Response, NextFunction } from 'express';
import pool from '../db/connection';
import { AuthRequest } from './auth';

export const auditLogger = async (
  req: Request | AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (process.env.ENABLE_AUDIT_LOGS !== 'true') {
    return next();
  }

  // Log sensitive actions
  const sensitiveActions = ['POST /api/incidents', 'PUT /api/incidents', 'PUT /api/admin'];
  const isSensitive = sensitiveActions.some(action => req.path.includes(action.split(' ')[1]));

  if (isSensitive && (req as AuthRequest).user) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action_type, resource_type, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?)`,
        [
          (req as AuthRequest).user?.id,
          `${req.method} ${req.path}`,
          'incident',
          req.ip || req.socket.remoteAddress,
          req.get('user-agent') || '',
        ]
      );
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  next();
};

