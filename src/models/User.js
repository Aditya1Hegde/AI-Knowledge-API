import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

class User {
  static async create({ email, password, name, role = 'user' }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const query = `
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, role, created_at
    `;
    
    const result = await pool.query(query, [email, hashedPassword, name, role]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, name, role, is_active, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async update(id, updates) {
    const { name, email } = updates;
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          email = COALESCE($2, email),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, name, role
    `;
    
    const result = await pool.query(query, [name, email, id]);
    return result.rows[0];
  }

  static async deactivate(id) {
    const query = 'UPDATE users SET is_active = false WHERE id = $1';
    await pool.query(query, [id]);
  }
}

export default User;
