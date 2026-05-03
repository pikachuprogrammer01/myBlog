const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS interview_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(50) NOT NULL,
      difficulty ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
      summary VARCHAR(500) DEFAULT '',
      content MEDIUMTEXT NOT NULL,
      view_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_difficulty (difficulty)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS interview_question_tags (
      question_id INT NOT NULL,
      tag_name VARCHAR(50) NOT NULL,
      PRIMARY KEY (question_id, tag_name),
      FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}

const VALID_CATEGORIES = ['js', 'vue', 'css', 'algorithm', 'engineering', 'project'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

function validateQuestion(body) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push('标题不能为空');
  if (!body.category || !VALID_CATEGORIES.includes(body.category)) errors.push('分类无效');
  if (!body.difficulty || !VALID_DIFFICULTIES.includes(body.difficulty)) errors.push('难度无效');
  if (!body.content || !body.content.trim()) errors.push('内容不能为空');
  return errors;
}

async function syncTags(questionId, tags) {
  // Remove old tags
  await pool.execute('DELETE FROM interview_question_tags WHERE question_id = ?', [questionId]);

  if (!tags || tags.length === 0) return;

  for (const tag of tags) {
    const name = tag.trim();
    if (!name) continue;
    // Insert tag link
    await pool.execute(
      'INSERT IGNORE INTO interview_question_tags (question_id, tag_name) VALUES (?, ?)',
      [questionId, name]
    );
    // Sync to global tags table
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-_一-龥]/g, '');
    await pool.execute(
      'INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)',
      [name, slug]
    );
  }
}

// GET /api/admin/interview — list all
router.get('/', async (req, res) => {
  try {
    await ensureTable();

    const page = parseInt(req.query.page) || 1;
    const rawLimit = parseInt(req.query.limit) || 20;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const { search, category, difficulty } = req.query;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (q.title LIKE ? OR q.summary LIKE ? OR q.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category && VALID_CATEGORIES.includes(category)) {
      where += ' AND q.category = ?';
      params.push(category);
    }
    if (difficulty && VALID_DIFFICULTIES.includes(difficulty)) {
      where += ' AND q.difficulty = ?';
      params.push(difficulty);
    }

    const [rows] = await pool.execute(
      `SELECT q.id, q.title, q.category, q.difficulty, q.summary, q.view_count, q.created_at, q.updated_at
      FROM interview_questions q
      ${where}
      ORDER BY q.created_at DESC
      LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM interview_questions q ${where}`,
      params
    );

    // Fetch tags
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const placeholders = ids.map(() => '?').join(',');
      const [tagRows] = await pool.execute(
        `SELECT question_id, tag_name FROM interview_question_tags WHERE question_id IN (${placeholders})`,
        ids
      );
      const tagMap = {};
      tagRows.forEach((t) => {
        if (!tagMap[t.question_id]) tagMap[t.question_id] = [];
        tagMap[t.question_id].push(t.tag_name);
      });
      rows.forEach((r) => {
        r.tags = tagMap[r.id] || [];
      });
    }

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(total),
        totalPages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Interview] 获取题目列表失败:', error);
    return res.status(500).json({ success: false, message: '获取题目列表失败' });
  }
});

// GET /api/admin/interview/:id — single
router.get('/:id', async (req, res) => {
  try {
    await ensureTable();
    const id = parseInt(req.params.id);
    const [rows] = await pool.execute('SELECT * FROM interview_questions WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }
    const [tagRows] = await pool.execute(
      'SELECT tag_name FROM interview_question_tags WHERE question_id = ?',
      [id]
    );
    rows[0].tags = tagRows.map((t) => t.tag_name);
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('[Admin Interview] 获取题目失败:', error);
    return res.status(500).json({ success: false, message: '获取题目失败' });
  }
});

// POST /api/admin/interview — create
router.post('/', async (req, res) => {
  try {
    await ensureTable();

    const errors = validateQuestion(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const { title, category, difficulty, summary, content, tags } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO interview_questions (title, category, difficulty, summary, content)
      VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), category, difficulty, summary || '', content.trim()]
    );

    const questionId = result.insertId;

    // Sync tags
    const tagArray = typeof tags === 'string'
      ? tags.split(',').filter(Boolean)
      : (Array.isArray(tags) ? tags : []);
    await syncTags(questionId, tagArray);

    return res.status(201).json({ success: true, data: { id: questionId } });
  } catch (error) {
    console.error('[Admin Interview] 创建题目失败:', error);
    return res.status(500).json({ success: false, message: '创建题目失败' });
  }
});

// PUT /api/admin/interview/:id — update
router.put('/:id', async (req, res) => {
  try {
    await ensureTable();

    const id = parseInt(req.params.id);
    const [existing] = await pool.execute('SELECT id FROM interview_questions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }

    const errors = validateQuestion(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const { title, category, difficulty, summary, content, tags } = req.body;

    await pool.execute(
      `UPDATE interview_questions
      SET title = ?, category = ?, difficulty = ?, summary = ?, content = ?
      WHERE id = ?`,
      [title.trim(), category, difficulty, summary || '', content.trim(), id]
    );

    const tagArray = typeof tags === 'string'
      ? tags.split(',').filter(Boolean)
      : (Array.isArray(tags) ? tags : []);
    await syncTags(id, tagArray);

    return res.status(200).json({ success: true, message: '题目已更新' });
  } catch (error) {
    console.error('[Admin Interview] 更新题目失败:', error);
    return res.status(500).json({ success: false, message: '更新题目失败' });
  }
});

// DELETE /api/admin/interview/:id — delete
router.delete('/:id', async (req, res) => {
  try {
    await ensureTable();

    const id = parseInt(req.params.id);
    const [existing] = await pool.execute('SELECT id FROM interview_questions WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }

    await pool.execute('DELETE FROM interview_questions WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '题目已删除' });
  } catch (error) {
    console.error('[Admin Interview] 删除题目失败:', error);
    return res.status(500).json({ success: false, message: '删除题目失败' });
  }
});

module.exports = router;
