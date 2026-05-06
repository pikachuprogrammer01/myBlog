#!/usr/bin/env node
/**
 * Sync embeddings from api/data/article-embeddings.json → TiDB articles.embedding
 *
 * Usage: node scripts/sync-embeddings-to-db.cjs
 * Requires: api/.env with DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const ROOT = path.resolve(__dirname, '..');
const EMBEDDINGS_FILE = path.join(ROOT, 'api', 'data', 'article-embeddings.json');

async function main() {
  // Load dotenv from api/.env
  require('dotenv').config({ path: path.join(ROOT, 'api', '.env') });

  if (!fs.existsSync(EMBEDDINGS_FILE)) {
    console.error('Embeddings file not found. Run: npm run build:content (with EMBEDDING_API_KEY)');
    process.exit(1);
  }

  const embeddings = JSON.parse(fs.readFileSync(EMBEDDINGS_FILE, 'utf-8'));
  console.log(`Found ${embeddings.length} embeddings`);

  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('DB credentials not found in api/.env');
    process.exit(1);
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
  });

  let updated = 0;
  let skipped = 0;

  for (const { id, embedding } of embeddings) {
    const vecStr = JSON.stringify(embedding);
    try {
      const [result] = await pool.execute(
        'UPDATE articles SET embedding = ? WHERE slug = ?',
        [vecStr, id],
      );
      if (result.affectedRows > 0) {
        updated++;
      } else {
        console.warn(`  ⚠️  No article found for slug: ${id}`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ✗ ${id}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Sync failed:', err.message);
  process.exit(1);
});
