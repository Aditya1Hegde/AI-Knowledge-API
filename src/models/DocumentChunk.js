import pool from '../config/database.js';

class DocumentChunk {
  static async create({ documentId, chunkNumber, content, tokenCount, embedding = null }) {
    const query = `
      INSERT INTO document_chunks (document_id, chunk_number, content, token_count, embedding)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, document_id, chunk_number, token_count, created_at
    `;
    
    const embeddingValue = embedding ? JSON.stringify(embedding) : null;
    
    const result = await pool.query(query, [documentId, chunkNumber, content, tokenCount, embeddingValue]);
    return result.rows[0];
  }

  static async findByDocumentId(documentId) {
    const query = `
      SELECT id, chunk_number, content, token_count, created_at 
      FROM document_chunks 
      WHERE document_id = $1 
      ORDER BY chunk_number ASC
    `;
    const result = await pool.query(query, [documentId]);
    return result.rows;
  }

  static async searchBySimilarity(queryEmbedding, limit = 5) {
    const query = `
      SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_number,
        dc.content,
        dc.token_count,
        d.title as document_title,
        d.user_id,
        1 - (dc.embedding <=> $1::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $2
    `;
    
    const embeddingString = JSON.stringify(queryEmbedding);
    const result = await pool.query(query, [embeddingString, limit]);
    return result.rows;
  }

  static async searchBySimilarityForUser(queryEmbedding, userId, limit = 5) {
    const query = `
      SELECT 
        dc.id,
        dc.document_id,
        dc.chunk_number,
        dc.content,
        dc.token_count,
        d.title as document_title,
        1 - (dc.embedding <=> $1::vector) as similarity
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE dc.embedding IS NOT NULL AND d.user_id = $2
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3
    `;
    
    const embeddingString = JSON.stringify(queryEmbedding);
    const result = await pool.query(query, [embeddingString, userId, limit]);
    return result.rows;
  }

  static async deleteByDocumentId(documentId) {
    const query = 'DELETE FROM document_chunks WHERE document_id = $1';
    await pool.query(query, [documentId]);
  }
}

export default DocumentChunk;
