import express from 'express';
import pool from '../db/connection';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { awardCoinsForReport } from '../services/coinService';

const router = express.Router();

// Verify incident
router.put('/incidents/:id/verify', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // Get incident
    const [incidents] = await pool.query(
      'SELECT * FROM incidents WHERE id = ?',
      [id]
    ) as any[];

    if (incidents.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = incidents[0];

    // Update verification status
    if (verified) {
      await pool.query(
        `UPDATE incidents 
         SET is_verified = TRUE, verified_by = ?, verified_at = NOW()
         WHERE id = ?`,
        [req.user!.id, id]
      );

      // Award additional coins if not already verified
      if (!incident.is_verified) {
        await awardCoinsForReport(incident.user_id, parseInt(id), true);
      }

      // Log verification
      await pool.query(
        `INSERT INTO report_verifications 
         (incident_id, verifier_id, verification_action, verification_notes)
         VALUES (?, ?, 'verified', ?)`,
        [id, req.user!.id, req.body.notes || 'Admin verified']
      );
    } else {
      await pool.query(
        `UPDATE incidents 
         SET is_verified = FALSE, verified_by = NULL, verified_at = NULL
         WHERE id = ?`,
        [id]
      );

      await pool.query(
        `INSERT INTO report_verifications 
         (incident_id, verifier_id, verification_action, verification_notes)
         VALUES (?, ?, 'rejected', ?)`,
        [id, req.user!.id, req.body.notes || 'Admin rejected']
      );
    }

    res.json({ message: `Incident ${verified ? 'verified' : 'unverified'} successfully` });
  } catch (err) {
    next(err);
  }
});

// Ban user
router.put('/users/:id/ban', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { banned, reason } = req.body;

    await pool.query(
      'UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?',
      [banned, reason || null, id]
    );

    // Log action
    await pool.query(
      `INSERT INTO audit_logs 
       (user_id, action_type, resource_type, resource_id, action_details)
       VALUES (?, ?, 'user', ?, ?)`,
      [
        req.user!.id,
        `USER_${banned ? 'BANNED' : 'UNBANNED'}`,
        id,
        JSON.stringify({ targetUserId: id, reason }),
      ]
    );

    res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
  } catch (err) {
    next(err);
  }
});

// Get all incidents for admin
router.get('/incidents', authenticate, requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [incidents] = await pool.query(
      `SELECT 
        i.*,
        u.email as reporter_email,
        u.is_verified as reporter_verified,
        u.is_banned as reporter_banned
       FROM incidents i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT 100`
    ) as any[];

    res.json(incidents);
  } catch (err) {
    next(err);
  }
});

export default router;

