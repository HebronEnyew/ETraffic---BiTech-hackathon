import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/connection';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadIdPhoto } from '../middleware/upload';
import { verifyIDPhoto } from '../services/ocrVerification';
import Joi from 'joi';
import path from 'path';

const router = express.Router();

const registerSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: ['test', 'local', 'example', 'com', 'org', 'net', 'edu', 'gov'] } })
    .required(),
  password: Joi.string().min(8).required(),
  fullName: Joi.string().optional(),
  username: Joi.string().min(3).required(),
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: ['test', 'local', 'example', 'com', 'org', 'net', 'edu', 'gov'] } })
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
      'string.empty': 'Email cannot be empty',
    }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty',
  }),
});

/**
 * Register with ID photo upload
 * Handles multipart/form-data
 */
router.post('/register', authRateLimiter, (req, res, next) => {
  uploadIdPhoto.single('nationalIdPhoto')(req, res, (err: any) => {
    if (err) {
      // Handle multer errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
      }
      if (err.message && err.message.includes('Only JPG, PNG, and PDF files')) {
        return res.status(400).json({ error: err.message });
      }
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload failed. Please try again.' });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    console.log('Registration attempt - File:', req.file ? 'Present' : 'Missing');
    console.log('Registration attempt - Body:', {
      email: req.body.email,
      username: req.body.username,
      hasFullName: !!req.body.fullName,
    });

    // Handle multer errors - check if file exists
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'National ID photo is required' });
    }

    const { error, value } = registerSchema.validate({
      email: req.body.email,
      password: req.body.password,
      fullName: req.body.fullName,
      username: req.body.username,
    });

    if (error) {
      // Clean up uploaded file if validation fails
      if (req.file && req.file.path) {
        try {
          const fs = require('fs');
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, fullName, username } = value;

    console.log('Validated registration data:', { email, username, hasFullName: !!fullName });

    // Check if user exists - handle both old and new schema
    let [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    // Try to check username if column exists
    try {
      const [usernameCheck] = await pool.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      ) as any[];
      if (usernameCheck.length > 0) {
        existingUsers = [...existingUsers, ...usernameCheck];
      }
    } catch (e) {
      // Username column doesn't exist, skip
    }

    if (existingUsers.length > 0) {
      // Clean up uploaded file if user already exists
      if (req.file && req.file.path) {
        try {
          const fs = require('fs');
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      return res.status(400).json({ error: 'Email or username already registered' });
    }

    // Validate ID photo
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'National ID photo upload failed' });
    }

    const filePath = req.file.path;
    let ocrResult;
    
    try {
      ocrResult = await verifyIDPhoto(filePath);
    } catch (ocrError: any) {
      // If OCR verification fails, allow registration but mark as unverified
      console.error('OCR verification error:', ocrError);
      ocrResult = {
        isValid: false,
        metadataValid: false,
        errors: ['OCR verification service unavailable'],
      };
    }

    // Extract national ID from OCR result or generate a temporary unique ID
    let ethiopianNationalId: string | null = null;
    if (ocrResult?.idNumber) {
      ethiopianNationalId = ocrResult.idNumber;
      console.log('Extracted national ID from OCR:', ethiopianNationalId);
    } else {
      // Generate a temporary unique ID based on email and timestamp if OCR didn't extract it
      // This ensures uniqueness while allowing registration when OCR fails
      ethiopianNationalId = `TEMP_${Date.now()}_${email.split('@')[0].substring(0, 10)}`;
      console.log('Generated temporary national ID:', ethiopianNationalId);
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Save relative path - ensure path is calculated correctly
    let relativePath: string;
    try {
      const uploadsBasePath = path.join(__dirname, '../../uploads');
      console.log('Uploads base path:', uploadsBasePath);
      console.log('File path:', filePath);
      relativePath = path.relative(uploadsBasePath, filePath);
      // Normalize path separators for cross-platform compatibility
      relativePath = relativePath.replace(/\\/g, '/');
      console.log('Relative path calculated:', relativePath);
    } catch (pathError: any) {
      console.error('Error calculating relative path:', pathError);
      // Fallback: use just the filename
      relativePath = path.basename(filePath);
      console.log('Using fallback relative path:', relativePath);
    }

    // Try to insert with new schema first, fallback to old schema if columns don't exist
    let insertQuery: string;
    let insertParams: any[];
    let result: any;

    try {
      // Try new schema with username and full_name
      console.log('Attempting to insert with new schema...');
      // Check if ethiopian_national_id column exists by trying to include it
      insertQuery = `INSERT INTO users 
                     (email, password_hash, username, full_name, is_verified, is_trusted, 
                      id_photo_path, coins_balance, photo_count, ethiopian_national_id)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`;
      insertParams = [
        email,
        passwordHash,
        username,
        fullName || null,
        ocrResult.isValid || false,
        ocrResult.isValid || false,
        relativePath,
        ethiopianNationalId,
      ];
      [result] = await pool.query(insertQuery, insertParams) as any[];
      console.log('User inserted successfully with new schema. ID:', result.insertId);
    } catch (schemaError: any) {
      console.error('New schema insert failed:', schemaError.code, schemaError.message);
      // If new schema fails, try old schema
      if (schemaError.code === 'ER_BAD_FIELD_ERROR' || schemaError.code === 'ER_NO_SUCH_TABLE') {
        console.log('Trying old schema...');
        const nameParts = (fullName || '').split(' ');
        const firstName = nameParts[0] || null;
        const lastName = nameParts.slice(1).join(' ') || null;
        
        // Try with ethiopian_national_id in old schema
        insertQuery = `INSERT INTO users 
                       (email, password_hash, first_name, last_name, is_verified, coins_balance, ethiopian_national_id)
                       VALUES (?, ?, ?, ?, ?, 0, ?)`;
        insertParams = [
          email,
          passwordHash,
          firstName,
          lastName,
          ocrResult.isValid || false,
          ethiopianNationalId,
        ];
        try {
          [result] = await pool.query(insertQuery, insertParams) as any[];
          console.log('User inserted successfully with old schema. ID:', result.insertId);
        } catch (insertError: any) {
          // If ethiopian_national_id doesn't exist in old schema, try without it
          if (insertError.code === 'ER_BAD_FIELD_ERROR') {
            console.log('Trying old schema without ethiopian_national_id...');
            insertQuery = `INSERT INTO users 
                           (email, password_hash, first_name, last_name, is_verified, coins_balance)
                           VALUES (?, ?, ?, ?, ?, 0)`;
            insertParams = [
              email,
              passwordHash,
              firstName,
              lastName,
              ocrResult.isValid || false,
            ];
            [result] = await pool.query(insertQuery, insertParams) as any[];
            console.log('User inserted successfully with old schema (no national ID). ID:', result.insertId);
          } else {
            console.error('Old schema insert also failed:', insertError.code, insertError.message);
            // Clean up file if database insertion fails
            if (req.file && req.file.path) {
              try {
                const fs = require('fs');
                if (fs.existsSync(req.file.path)) {
                  fs.unlinkSync(req.file.path);
                }
              } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
              }
            }
            throw insertError;
          }
        }
      } else {
        // Clean up file if database insertion fails
        if (req.file && req.file.path) {
          try {
            const fs = require('fs');
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          } catch (cleanupError) {
            console.error('Error cleaning up file:', cleanupError);
          }
        }
        throw schemaError;
      }
    }

    res.status(201).json({
      message: 'Registration successful',
      userId: result.insertId,
      isTrusted: ocrResult.isValid || false,
    });
  } catch (err: any) {
    // Clean up uploaded file on any error
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    console.error('Registration error:', err);
    next(err);
  }
});

/**
 * Login
 * Handles JSON or form data
 */
router.post('/login', authRateLimiter, async (req, res, next) => {
  try {
    console.log('Login attempt - Body:', req.body);
    console.log('Login attempt - Content-Type:', req.headers['content-type']);
    
    // Check if body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Login error: Request body is empty');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate request body with abortEarly: false to get all errors
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
    
    if (error) {
      console.error('Login validation error:', error.details);
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }

    let { email, password } = value;
    
    // Trim whitespace and normalize email
    email = email.trim().toLowerCase();
    password = password.trim();
    
    // Additional checks after trimming
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Login attempt - Validated email:', email);

    // Get user - handle both old and new schema (case-insensitive email match)
    const [users] = await pool.query(
      `SELECT id, email, 
              COALESCE(username, CONCAT(first_name, ' ', last_name)) as username,
              password_hash, is_verified, is_admin, 
              COALESCE(is_trusted, FALSE) as is_trusted, 
              coins_balance, is_banned 
       FROM users 
       WHERE LOWER(email) = LOWER(?)`,
      [email]
    ) as any[];

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    const token = jwt.sign(
      { userId: user.id },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.is_verified,
        isTrusted: user.is_trusted,
        isAdmin: user.is_admin,
        coinsBalance: user.coins_balance,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get current user
 */
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT id, email, 
              COALESCE(username, CONCAT(first_name, ' ', last_name)) as username,
              COALESCE(full_name, CONCAT(first_name, ' ', last_name)) as full_name,
              is_verified, 
              COALESCE(is_trusted, FALSE) as is_trusted, 
              is_admin, 
              coins_balance, 
              COALESCE(photo_count, 0) as photo_count 
       FROM users 
       WHERE id = ?`,
      [req.user!.id]
    ) as any[];

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name,
      isVerified: user.is_verified,
      isTrusted: user.is_trusted,
      isAdmin: user.is_admin,
      coinsBalance: user.coins_balance,
      photoCount: user.photo_count,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
