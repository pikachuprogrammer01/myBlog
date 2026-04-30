const { requireAdmin } = require('../middleware/auth');
const pool = require('../db');

// POST /api/contact — 提交联系表单
async function submitContact(req, res) {
  const { name, email, subject, message } = req.body || {};

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: '姓名至少需要 2 个字符' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: '请输入正确的邮箱格式' });
  }
  if (!subject || subject.trim().length < 4) {
    return res.status(400).json({ success: false, message: '主题至少需要 4 个字符' });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: '消息内容至少需要 10 个字符' });
  }

  try {
    await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim(), subject.trim(), message.trim()]
    );

    return res.status(201).json({ success: true, message: '留言提交成功' });
  } catch (error) {
    console.error('提交联系表单失败:', error);
    return res.status(500).json({ success: false, message: '提交失败，请稍后重试' });
  }
}

// GET /api/contact — 获取所有联系消息（管理员）
async function getContactMessages(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('获取联系消息失败:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
}

// PUT /api/contact/:id/read — 标记已读
async function markRead(req, res, id) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    await pool.execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('标记已读失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

module.exports = { submitContact, getContactMessages, markRead };
