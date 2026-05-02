const { requireAdmin } = require('../middleware/auth');
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
  tableReady = true;
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/admin/tags — 获取所有标签（含文章数）
async function getTags(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await ensureTable();
    const [tags] = await pool.execute('SELECT id, name, slug, created_at FROM tags ORDER BY name');

    // 从文章 JSON 数组中统计每个标签的使用次数
    const [articles] = await pool.execute('SELECT tags FROM articles WHERE status = ?', ['published']);
    const usage = {};
    articles.forEach((a) => {
      let t;
      try {
        t = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags;
      } catch {
        t = [];
      }
      (Array.isArray(t) ? t : []).forEach((name) => {
        usage[name] = (usage[name] || 0) + 1;
      });
    });

    const data = tags.map((t) => ({ ...t, articleCount: usage[t.name] || 0 }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Tags] 获取标签列表失败:', error);
    return res.status(500).json({ success: false, message: '获取标签失败' });
  }
}

// POST /api/admin/tags — 新增标签
async function createTag(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { name } = req.body || {};
  if (!name || name.trim().length < 1 || name.trim().length > 50) {
    return res.status(400).json({ success: false, message: '标签名称需在 1-50 个字符之间' });
  }

  const slug = slugify(name.trim());
  if (!slug) {
    return res.status(400).json({ success: false, message: '标签名称无效' });
  }

  try {
    await ensureTable();
    const [result] = await pool.execute('INSERT INTO tags (name, slug) VALUES (?, ?)', [name.trim(), slug]);
    return res.status(201).json({ success: true, data: { id: result.insertId, name: name.trim(), slug } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '标签名称已存在' });
    }
    console.error('[Tags] 创建标签失败:', error);
    return res.status(500).json({ success: false, message: '创建标签失败' });
  }
}

// PUT /api/admin/tags/:id — 重命名标签（同步更新文章 JSON 数组）
async function updateTag(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  const { name } = req.body || {};
  if (!name || name.trim().length < 1 || name.trim().length > 50) {
    return res.status(400).json({ success: false, message: '标签名称需在 1-50 个字符之间' });
  }

  const newSlug = slugify(name.trim());
  if (!newSlug) {
    return res.status(400).json({ success: false, message: '标签名称无效' });
  }

  try {
    await ensureTable();

    // 获取旧标签名
    const [rows] = await pool.execute('SELECT name FROM tags WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }
    const oldName = rows[0].name;

    // 更新标签表
    await pool.execute('UPDATE tags SET name = ?, slug = ? WHERE id = ?', [name.trim(), newSlug, id]);

    // 同步更新文章中的 JSON 数组：将旧标签名替换为新标签名
    if (oldName !== name.trim()) {
      const [articles] = await pool.execute('SELECT id, tags FROM articles');
      for (const a of articles) {
        let t;
        try {
          t = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags;
        } catch {
          continue;
        }
        if (!Array.isArray(t)) continue;
        const idx = t.findIndex((tag) => tag === oldName);
        if (idx !== -1) {
          t[idx] = name.trim();
          await pool.execute('UPDATE articles SET tags = ? WHERE id = ?', [JSON.stringify(t), a.id]);
        }
      }
    }

    return res.status(200).json({ success: true, data: { id, name: name.trim(), slug: newSlug } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: '标签名称已存在' });
    }
    console.error('[Tags] 更新标签失败:', error);
    return res.status(500).json({ success: false, message: '更新标签失败' });
  }
}

// DELETE /api/admin/tags/:id — 删除标签（从文章 JSON 数组中移除）
async function deleteTag(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await ensureTable();

    const [rows] = await pool.execute('SELECT name FROM tags WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }
    const tagName = rows[0].name;

    // 删除标签
    await pool.execute('DELETE FROM tags WHERE id = ?', [id]);

    // 从所有文章中移除该标签
    const [articles] = await pool.execute('SELECT id, tags FROM articles');
    for (const a of articles) {
      let t;
      try {
        t = typeof a.tags === 'string' ? JSON.parse(a.tags) : a.tags;
      } catch {
        continue;
      }
      if (!Array.isArray(t)) continue;
      const filtered = t.filter((tag) => tag !== tagName);
      if (filtered.length !== t.length) {
        await pool.execute('UPDATE articles SET tags = ? WHERE id = ?', [JSON.stringify(filtered), a.id]);
      }
    }

    return res.status(200).json({ success: true, message: '标签已删除' });
  } catch (error) {
    console.error('[Tags] 删除标签失败:', error);
    return res.status(500).json({ success: false, message: '删除标签失败' });
  }
}

module.exports = { getTags, createTag, updateTag, deleteTag };
