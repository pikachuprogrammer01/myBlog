const express = require('express');
const router = express.Router();
const pool = require('../db');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      slug VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_name (name),
      UNIQUE KEY uk_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await syncTagsFromArticles();
  tableReady = true;
}

async function syncTagsFromArticles() {
  try {
    const [articles] = await pool.execute('SELECT tags FROM articles');
    const allTagNames = new Set();
    articles.forEach((a) => {
      let t;
      try { t = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags; } catch { t = []; }
      (Array.isArray(t) ? t : []).forEach((name) => {
        if (name && name.trim().length <= 50) {
          allTagNames.add(name.trim());
        }
      });
    });

    for (const name of allTagNames) {
      const slug = slugify(name);
      if (!slug) continue;
      try {
        await pool.execute('INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)', [name, slug]);
      } catch { /* tag may already exist */ }
    }
  } catch (error) {
    console.error('[Tags] 同步文章标签到字典表失败:', error.message);
  }
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/tags — public
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [managedTags] = await pool.execute('SELECT id, name, slug, created_at FROM tags ORDER BY name');

    const [articles] = await pool.execute('SELECT tags FROM articles WHERE status = ?', ['published']);
    const usage = {};
    articles.forEach((a) => {
      let t;
      try { t = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags; } catch { t = []; }
      (Array.isArray(t) ? t : []).forEach((name) => { usage[name] = (usage[name] || 0) + 1; });
    });

    const managedNames = new Set(managedTags.map((t) => t.name));
    const data = managedTags.map((t) => ({ ...t, articleCount: usage[t.name] || 0 }));

    Object.entries(usage).forEach(([name, count]) => {
      if (!managedNames.has(name)) {
        data.push({ id: null, name, slug: '', articleCount: count, created_at: null, orphan: true });
      }
    });

    data.sort((a, b) => b.articleCount - a.articleCount);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Tags] 获取公开标签列表失败:', error);
    return res.status(500).json({ success: false, message: '获取标签失败' });
  }
});

module.exports = router;
module.exports.syncTagsFromArticles = syncTagsFromArticles;
