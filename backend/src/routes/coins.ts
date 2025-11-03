import express from 'express';
import pool from '../db/connection';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  getCoinBalance,
  convertCoinsToBirr,
  getCoinTransactions,
} from '../services/coinService';

const router = express.Router();

// Get coin balance
router.get('/balance', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const balance = await getCoinBalance(req.user!.id);
    res.json({ balance });
  } catch (err) {
    next(err);
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const transactions = await getCoinTransactions(req.user!.id);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Convert coins to Birr
router.post('/convert', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { coins } = req.body;

    if (!coins || isNaN(coins) || coins <= 0) {
      return res.status(400).json({ error: 'Invalid coin amount' });
    }

    const result = await convertCoinsToBirr(req.user!.id, parseInt(coins));

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'Coins converted successfully',
      birrAmount: result.birrAmount,
      newBalance: result.newBalance,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

