const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

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

// GET /
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT * FROM projects ORDER BY sort_order, id');
    const data = rows.map((r) => ({
      ...r,
      tech_stack: typeof r.tech_stack === 'string' ? JSON.parse(r.tech_stack) : r.tech_stack,
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Admin/Projects] 获取项目列表失败:', error);
    return res.status(500).json({ success: false, message: '获取项目列表失败' });
  }
});

// POST /
router.post('/', async (req, res) => {
  const { name, slug, description, url, tech_stack, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '项目名称不能为空' });
  }
  if (!url || !url.trim()) {
    return res.status(400).json({ success: false, message: '项目链接不能为空' });
  }

  const projectSlug = (slug || name).trim().toLowerCase().replace(/\s+/g, '-');

  try {
    await ensureTable();
    const [result] = await pool.execute(
      'INSERT INTO projects (name, slug, description, url, tech_stack, category, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name.trim(), projectSlug, description || '', url.trim(), JSON.stringify(tech_stack || []), category || '前端', sort_order || 0]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId, slug: projectSlug } });
  } catch (error) {
    console.error('[Admin/Projects] 创建项目失败:', error);
    return res.status(500).json({ success: false, message: '创建项目失败' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, slug, description, url, tech_stack, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '项目名称不能为空' });
  }

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM projects WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    const projectSlug = (slug || name).trim().toLowerCase().replace(/\s+/g, '-');

    await pool.execute(
      'UPDATE projects SET name = ?, slug = ?, description = ?, url = ?, tech_stack = ?, category = ?, sort_order = ? WHERE id = ?',
      [name.trim(), projectSlug, description || '', url || '', JSON.stringify(tech_stack || []), category || '前端', sort_order || 0, id]
    );
    return res.status(200).json({ success: true, message: '项目已更新' });
  } catch (error) {
    console.error('[Admin/Projects] 更新项目失败:', error);
    return res.status(500).json({ success: false, message: '更新项目失败' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM projects WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '项目不存在' });
    }

    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '项目已删除' });
  } catch (error) {
    console.error('[Admin/Projects] 删除项目失败:', error);
    return res.status(500).json({ success: false, message: '删除项目失败' });
  }
});

module.exports = router;
