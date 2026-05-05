const express = require('express');
const router = express.Router();
const pool = require('../db');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      url VARCHAR(500),
      tech_stack JSON,
      category VARCHAR(100) DEFAULT '前端',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}

const DEFAULT_PROJECTS = [
  ['个人博客系统', 'myblog', '基于 Vue 3 + Element Plus 的全栈个人博客，支持文章管理、评论、收藏、管理后台等功能。', 'https://github.com/pikachuprogrammer01/myBlog', JSON.stringify(['Vue3', 'Element Plus', 'Vite', 'Node.js', 'MySQL']), '前端', 1],
];

async function seedDefaultProjects() {
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM projects');
  if (rows[0].cnt > 0) return;
  for (const p of DEFAULT_PROJECTS) {
    await pool.execute(
      'INSERT INTO projects (name, slug, description, url, tech_stack, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      p
    );
  }
}

// GET /api/projects — public
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    await seedDefaultProjects();
    const [rows] = await pool.execute('SELECT * FROM projects ORDER BY sort_order, id');

    const data = rows.map((r) => ({
      ...r,
      tech_stack: typeof r.tech_stack === 'string' ? JSON.parse(r.tech_stack) : r.tech_stack,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Projects] 获取项目列表失败:', error);
    return res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

module.exports = router;
