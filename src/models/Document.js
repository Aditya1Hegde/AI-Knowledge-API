import pool from '../config/database.js';

class Document {
  static async create({ userId, title, fileType, fileSize, originalFilename }) {
    const query = `
      INSERT INTO documents (user_id, title, file_type, file_size, original_filename, status)
      VALUES ($1, $2, $3, $4, $5, 'processing')
      RETURNING id, user_id, title, file_type, file_size, original_filename, status, created_at
    `;
    
    const result = await pool.query(query, [userId, title, fileType, fileSize, originalFilename]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM documents WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = `
      SELECT id, title, file_type, file_size, total_chunks, status, created_at 
      FROM documents 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE documents 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async updateChunkCount(id, totalChunks) {
    const query = `
      UPDATE documents 
      SET total_chunks = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(query, [totalChunks, id]);
  }

  static async delete(id) {
    const query = 'DELETE FROM documents WHERE id = $1';
    await pool.query(query, [id]);
  }
}

export default Document;
