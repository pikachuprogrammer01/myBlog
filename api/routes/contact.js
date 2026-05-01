const nodemailer = require('nodemailer');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const pool = require('../db');

const DAILY_LIMIT = 10;

// QQ 邮箱 SMTP 配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.QQ_EMAIL_USER,
    pass: process.env.QQ_EMAIL_PASS,
  },
});

// POST /api/contact — 提交联系表单（需登录，每人每天最多 10 条）
async function submitContact(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const { subject, message } = req.body || {};

  if (!subject || subject.trim().length < 4) {
    return res.status(400).json({ success: false, message: '主题至少需要 4 个字符' });
  }
  if (!message || message.trim().length < 10) {
    return res.status(400).json({ success: false, message: '消息内容至少需要 10 个字符' });
  }

  try {
    // 节流：每人每天最多 DAILY_LIMIT 条
    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM contact_messages WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [user.email || user.username]
    );
    if (cnt >= DAILY_LIMIT) {
      return res.status(429).json({ success: false, message: `每人每天最多发送 ${DAILY_LIMIT} 条留言，请明天再试` });
    }

    await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [user.username, user.email || user.username, subject.trim(), message.trim()]
    );

    // 异步发送邮件通知（不阻塞响应）
    if (process.env.QQ_EMAIL_USER && process.env.QQ_EMAIL_PASS) {
      const notifyEmail = process.env.CONTACT_EMAIL || process.env.QQ_EMAIL_USER;
      transporter.sendMail({
        from: `"博客留言通知" <${process.env.QQ_EMAIL_USER}>`,
        to: notifyEmail,
        subject: `[博客留言] ${subject.trim()}`,
        html: `
          <h3>来自博客的新留言</h3>
          <p><strong>用户：</strong>${user.username}</p>
          <p><strong>邮箱：</strong>${user.email || '未知'}</p>
          <p><strong>主题：</strong>${subject.trim()}</p>
          <p><strong>内容：</strong></p>
          <blockquote>${message.trim().replace(/\n/g, '<br>')}</blockquote>
          <hr>
          <p style="color:#909399;font-size:12px">此邮件由博客系统自动发送</p>
        `,
      }).catch((err) => console.error('发送邮件通知失败:', err.message));
    }

    const remaining = Math.max(0, DAILY_LIMIT - (cnt + 1));
    return res.status(201).json({ success: true, message: '留言已发送', data: { remaining } });
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

// GET /api/contact/remaining — 查询今日剩余可发送次数
async function getRemaining(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) as cnt FROM contact_messages WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)',
      [user.email || user.username]
    );
    return res.status(200).json({
      success: true,
      data: { remaining: Math.max(0, DAILY_LIMIT - cnt) },
    });
  } catch (error) {
    console.error('查询剩余次数失败:', error);
    return res.status(500).json({ success: false, message: '查询失败' });
  }
}

module.exports = { submitContact, getContactMessages, markRead, getRemaining };
