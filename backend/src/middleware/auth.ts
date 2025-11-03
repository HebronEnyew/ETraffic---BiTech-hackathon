import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    isVerified: boolean;
    isAdmin: boolean;
    coinsBalance: number;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, secret) as { userId: number };
    
    // Get user from database
    const [users] = await pool.query(
      'SELECT id, email, is_verified, is_admin, coins_balance, is_banned FROM users WHERE id = ?',
      [decoded.userId]
    ) as any[];

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = users[0];

    if (user.is_banned) {
      return res.status(403).json({ error: 'User is banned' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      isVerified: user.is_verified,
      isAdmin: user.is_admin,
      coinsBalance: user.coins_balance,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Verified account required' });
  }

  next();
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

