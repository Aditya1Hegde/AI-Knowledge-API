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

async function enableVector() {
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

enableVector();
