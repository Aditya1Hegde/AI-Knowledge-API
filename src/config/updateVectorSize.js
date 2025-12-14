import pool from './database.js';

async function updateVectorSize() {
  try {
    console.log('🔧 Updating vector column size...');
    
    // Drop existing embedding column and recreate with correct size
    await pool.query(`
      ALTER TABLE document_chunks 
      DROP COLUMN IF EXISTS embedding;
    `);
    
    await pool.query(`
      ALTER TABLE document_chunks 
      ADD COLUMN embedding vector(384);
    `);
    
    // Recreate index with correct size
    await pool.query(`
      DROP INDEX IF EXISTS idx_chunks_embedding;
    `);
    
    await pool.query(`
      CREATE INDEX idx_chunks_embedding ON document_chunks 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    `);
    
    console.log('✅ Vector column updated to 384 dimensions!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateVectorSize();
