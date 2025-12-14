import pool from './database.js';

async function addSearchColumn() {
  try {
    console.log('📝 Adding full-text search to snippets...');
    
    // Add tsvector column for full-text search
    await pool.query(`
      ALTER TABLE knowledge_snippets 
      ADD COLUMN IF NOT EXISTS search_vector tsvector;
    `);
    
    // Create index for fast searching
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_snippets_search 
      ON knowledge_snippets USING GIN(search_vector);
    `);
    
    // Create trigger to automatically update search_vector
    await pool.query(`
      CREATE OR REPLACE FUNCTION snippets_search_trigger() 
      RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := 
          setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
        RETURN NEW;
      END
      $$ LANGUAGE plpgsql;
    `);
    
    await pool.query(`
      DROP TRIGGER IF EXISTS snippets_search_update ON knowledge_snippets;
    `);
    
    await pool.query(`
      CREATE TRIGGER snippets_search_update 
      BEFORE INSERT OR UPDATE ON knowledge_snippets
      FOR EACH ROW EXECUTE FUNCTION snippets_search_trigger();
    `);
    
    // Update existing rows
    await pool.query(`
      UPDATE knowledge_snippets
      SET search_vector = 
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C');
    `);
    
    console.log('✅ Full-text search configured successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addSearchColumn();
