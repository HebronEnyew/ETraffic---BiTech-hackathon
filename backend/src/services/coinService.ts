/**
 * Coin Service
 * Handles coin awarding, balance tracking, and conversion to Ethiopian Birr
 */

import pool from '../db/connection';

const COINS_PER_REPORT = parseInt(process.env.COINS_PER_REPORT || '10');
const COINS_PER_VERIFIED_REPORT = parseInt(process.env.COINS_PER_VERIFIED_REPORT || '25');
const MIN_COINS_FOR_CONVERSION = parseInt(process.env.MIN_COINS_FOR_CONVERSION || '100');
const COIN_TO_BIRR_RATE = parseFloat(process.env.COIN_TO_BIRR_RATE || '1');

/**
 * Award coins to user for reporting incident
 */
export async function awardCoinsForReport(
  userId: number,
  incidentId: number,
  isVerified: boolean = false
): Promise<number> {
  const coinsToAward = isVerified ? COINS_PER_VERIFIED_REPORT : COINS_PER_REPORT;

  // Update user balance
  await pool.query(
    'UPDATE users SET coins_balance = coins_balance + ? WHERE id = ?',
    [coinsToAward, userId]
  );

  // Log transaction
  await pool.query(
    `INSERT INTO coin_transactions 
     (user_id, transaction_type, amount, incident_id, description, status)
     VALUES (?, 'earned', ?, ?, ?, 'completed')`,
    [
      userId,
      coinsToAward,
      incidentId,
      isVerified
        ? `Coins earned for verified incident report`
        : `Coins earned for incident report`,
    ]
  );

  return coinsToAward;
}

/**
 * Convert coins to Ethiopian Birr
 */
export async function convertCoinsToBirr(
  userId: number,
  coins: number
): Promise<{
  success: boolean;
  birrAmount?: number;
  newBalance?: number;
  error?: string;
}> {
  // Check minimum threshold
  if (coins < MIN_COINS_FOR_CONVERSION) {
    return {
      success: false,
      error: `Minimum ${MIN_COINS_FOR_CONVERSION} coins required for conversion`,
    };
  }

  // Get current balance
  const [users] = await pool.query(
    'SELECT coins_balance FROM users WHERE id = ?',
    [userId]
  ) as any[];

  if (users.length === 0) {
    return { success: false, error: 'User not found' };
  }

  const currentBalance = parseFloat(users[0].coins_balance);

  if (coins > currentBalance) {
    return { success: false, error: 'Insufficient coins' };
  }

  // Calculate Birr amount
  const birrAmount = coins * COIN_TO_BIRR_RATE;
  const newBalance = currentBalance - coins;

  // Update balance
  await pool.query(
    'UPDATE users SET coins_balance = ? WHERE id = ?',
    [newBalance, userId]
  );

  // Log transaction
  await pool.query(
    `INSERT INTO coin_transactions 
     (user_id, transaction_type, amount, birr_amount, exchange_rate, description, status)
     VALUES (?, 'converted', ?, ?, ?, ?, 'completed')`,
    [
      userId,
      coins,
      birrAmount,
      COIN_TO_BIRR_RATE,
      `Converted ${coins} coins to ${birrAmount} ETB`,
    ]
  );

  // NOTE: In production, this would integrate with a payment gateway
  // For now, this is a simulation - transaction is logged but no real money transfer occurs

  return {
    success: true,
    birrAmount,
    newBalance,
  };
}

/**
 * Get user coin balance
 */
export async function getCoinBalance(userId: number): Promise<number> {
  const [users] = await pool.query(
    'SELECT coins_balance FROM users WHERE id = ?',
    [userId]
  ) as any[];

  return users.length > 0 ? parseFloat(users[0].coins_balance) : 0;
}

/**
 * Get coin transaction history
 */
export async function getCoinTransactions(
  userId: number,
  limit: number = 50
): Promise<any[]> {
  const [transactions] = await pool.query(
    `SELECT * FROM coin_transactions 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ?`,
    [userId, limit]
  ) as any[];

  return transactions;
}

