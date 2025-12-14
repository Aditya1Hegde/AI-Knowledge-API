import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-this';
const REFRESH_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

class JWTService {
  // Generate access token
  static generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  }

  // Generate refresh token
  static generateRefreshToken(user) {
    const payload = { id: user.id };
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  }

  // Store refresh token in database
  static async storeRefreshToken(userId, token) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const query = `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    
    await pool.query(query, [userId, token, expiresAt]);
  }

  // Verify access token
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Verify refresh token
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Remove refresh token (logout)
  static async removeRefreshToken(token) {
    const query = 'DELETE FROM refresh_tokens WHERE token = $1';
    await pool.query(query, [token]);
  }
}

export default JWTService;
