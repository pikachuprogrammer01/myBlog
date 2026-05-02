const { requireAdmin } = require('../middleware/auth');
const pool = require('../db');

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tools (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      url VARCHAR(500),
      icon VARCHAR(500),
      category VARCHAR(100) DEFAULT '其他',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}

// GET /api/admin/tools
async function getTools(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT * FROM tools ORDER BY sort_order, id');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[Tools] 获取工具列表失败:', error);
    return res.status(500).json({ success: false, message: '获取工具列表失败' });
  }
}

// POST /api/admin/tools
async function createTool(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { name, description, url, icon, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '工具名称不能为空' });
  }
  if (!url || !url.trim()) {
    return res.status(400).json({ success: false, message: '工具链接不能为空' });
  }

  try {
    await ensureTable();
    const [result] = await pool.execute(
      'INSERT INTO tools (name, description, url, icon, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description || '', url.trim(), icon || '', category || '其他', sort_order || 0]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId, name: name.trim() } });
  } catch (error) {
    console.error('[Tools] 创建工具失败:', error);
    return res.status(500).json({ success: false, message: '创建工具失败' });
  }
}

// PUT /api/admin/tools/:id
async function updateTool(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { name, description, url, icon, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '工具名称不能为空' });
  }

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM tools WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    await pool.execute(
      'UPDATE tools SET name = ?, description = ?, url = ?, icon = ?, category = ?, sort_order = ? WHERE id = ?',
      [name.trim(), description || '', url || '', icon || '', category || '其他', sort_order || 0, id]
    );
    return res.status(200).json({ success: true, message: '工具已更新' });
  } catch (error) {
    console.error('[Tools] 更新工具失败:', error);
    return res.status(500).json({ success: false, message: '更新工具失败' });
  }
}

// DELETE /api/admin/tools/:id
async function deleteTool(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM tools WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    await pool.execute('DELETE FROM tools WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '工具已删除' });
  } catch (error) {
    console.error('[Tools] 删除工具失败:', error);
    return res.status(500).json({ success: false, message: '删除工具失败' });
  }
}

// GET /api/tools — 公开接口
async function getPublicTools(req, res) {
  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT * FROM tools ORDER BY sort_order, id');

    if (rows.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[Tools] 获取公开工具列表失败:', error);
    return res.status(500).json({ success: false, message: '获取工具列表失败' });
  }
}

module.exports = { getTools, createTool, updateTool, deleteTool, getPublicTools };
