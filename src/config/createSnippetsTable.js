import pool from './database.js';

async function createSnippetsTable() {
  try {
    console.log('📝 Creating snippets table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS knowledge_snippets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        embedding vector(384),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snippets_user ON knowledge_snippets(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snippets_document ON knowledge_snippets(document_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snippets_embedding ON knowledge_snippets 
      USING ivfflat (embedding vector_cosine_ops) 
      WITH (lists = 100);
    `);
    
    console.log('✅ Snippets table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSnippetsTable();
