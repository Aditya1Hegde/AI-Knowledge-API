import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'ep-still-surf-ad1my17b-pooler.c-2.us-east-1.aws.neon.tech',
  database: 'neondb',
  user: 'neondb_owner',
  password: 'npg_A3cPwDvNYQ7t',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

async function checkDocuments() {
  try {
    const docs = await pool.query('SELECT * FROM documents ORDER BY created_at DESC LIMIT 5');
    console.log('📄 Recent Documents:');
    console.log(docs.rows);
    
    const chunks = await pool.query('SELECT COUNT(*) as count FROM document_chunks');
    console.log('\n📊 Total Chunks:', chunks.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDocuments();
