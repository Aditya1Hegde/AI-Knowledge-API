import pool from '../config/database.js';

class Snippet {
  static async create({ userId, documentId, title, content, embedding, tags = [] }) {
    const query = `
      INSERT INTO knowledge_snippets (user_id, document_id, title, content, embedding, tags)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, user_id, document_id, title, content, tags, created_at
    `;
    
    const embeddingValue = embedding ? JSON.stringify(embedding) : null;
    const result = await pool.query(query, [userId, documentId || null, title, content, embeddingValue, tags]);
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM knowledge_snippets WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByUserId(userId, limit = 50, offset = 0) {
    const query = `
      SELECT s.id, s.title, s.content, s.tags, s.created_at, s.document_id, d.title as document_title
      FROM knowledge_snippets s
      LEFT JOIN documents d ON s.document_id = d.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  static async update(id, { title, content, tags }) {
    const query = `
      UPDATE knowledge_snippets
      SET title = $1, content = $2, tags = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, title, content, tags, updated_at
    `;
    const result = await pool.query(query, [title, content, tags, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM knowledge_snippets WHERE id = $1', [id]);
  }

  static async count(userId) {
    const result = await pool.query('SELECT COUNT(*) as count FROM knowledge_snippets WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].count);
  }

  // Full-text search
  static async fullTextSearch(query, userId, limit = 10) {
    const searchQuery = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.tags,
        s.document_id,
        d.title as document_title,
        ts_rank(s.search_vector, plainto_tsquery('english', $1)) as relevance,
        ts_headline('english', s.content, plainto_tsquery('english', $1), 
          'MaxWords=50, MinWords=25') as snippet
      FROM knowledge_snippets s
      LEFT JOIN documents d ON s.document_id = d.id
      WHERE s.user_id = $2 
        AND s.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY ts_rank(s.search_vector, plainto_tsquery('english', $1)) DESC
      LIMIT $3
    `;
    
    const result = await pool.query(searchQuery, [query, userId, limit]);
    return result.rows;
  }

  // Search by tags
  static async searchByTags(tags, userId, limit = 10) {
    const query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.tags,
        s.document_id,
        d.title as document_title,
        s.created_at
      FROM knowledge_snippets s
      LEFT JOIN documents d ON s.document_id = d.id
      WHERE s.user_id = $1 
        AND s.tags && $2
      ORDER BY s.created_at DESC
      LIMIT $3
    `;
    
    const result = await pool.query(query, [userId, tags, limit]);
    return result.rows;
  }

  // Combined search (text + tags)
  static async advancedSearch(searchText, tags, userId, limit = 10) {
    let query = `
      SELECT 
        s.id,
        s.title,
        s.content,
        s.tags,
        s.document_id,
        d.title as document_title,
        ts_rank(s.search_vector, plainto_tsquery('english', $1)) as relevance
      FROM knowledge_snippets s
      LEFT JOIN documents d ON s.document_id = d.id
      WHERE s.user_id = $2
    `;
    
    const params = [searchText, userId];
    let paramIndex = 3;

    if (searchText && searchText.trim().length > 0) {
      query += ` AND s.search_vector @@ plainto_tsquery('english', $1)`;
    }

    if (tags && tags.length > 0) {
      query += ` AND s.tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    query += ` ORDER BY ts_rank(s.search_vector, plainto_tsquery('english', $1)) DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export default Snippet;
