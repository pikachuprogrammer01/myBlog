const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuthMw, requireAdminMw } = require('../middleware/auth');
const { createTransporter, sendNotificationEmail } = require('../utils/mail');

const DAILY_LIMIT = 10;

// GET /contact/remaining
router.get('/remaining', requireAuthMw, async (req, res) => {
  const user = req.user;

  try {
    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM contact_messages WHERE name = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [user.username]
    );
    return res.status(200).json({
      success: true,
      data: { remaining: Math.max(0, DAILY_LIMIT - cnt) },
    });
  } catch (error) {
    console.error('[Contact] 查询剩余次数失败:', error);
    return res.status(500).json({ success: false, message: '查询失败' });
  }
});

// POST /contact
router.post('/', requireAuthMw, async (req, res) => {
  const user = req.user;
  const { subject, message, email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: '请提供有效的邮箱地址' });
  }
  if (!subject || subject.trim().length < 4) {
    return res.status(400).json({ success: false, message: '主题至少需要 4 个字符' });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: '消息内容至少需要 10 个字符' });
  }

  try {
    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM contact_messages WHERE name = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [user.username]
    );
    if (cnt >= DAILY_LIMIT) {
      return res.status(429).json({ success: false, message: `每人每天最多发送 ${DAILY_LIMIT} 条留言，请明天再试` });
    }

    await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [user.username, email || user.email || user.username, subject.trim(), message.trim()]
    );

    await sendNotificationEmail({
      username: user.username,
      email: email || user.email,
      subject: subject.trim(),
      message: message.trim(),
    });

    const remaining = Math.max(0, DAILY_LIMIT - (cnt + 1));
    return res.status(201).json({ success: true, message: '留言已发送', data: { remaining } });
  } catch (error) {
    console.error('[Contact] 提交联系表单失败:', error);
    return res.status(500).json({ success: false, message: '提交失败，请稍后重试' });
  }
});

// GET /contact
router.get('/', requireAdminMw, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM contact_messages ORDER BY created_at DESC'
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[Contact] 获取联系消息失败:', error);
    return res.status(500).json({ success: false, message: '获取失败' });
  }
});

// PUT /contact/:id/read
router.put('/:id/read', requireAdminMw, async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await pool.execute('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '已标记为已读' });
  } catch (error) {
    console.error('[Contact] 标记已读失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
});

module.exports = router;
