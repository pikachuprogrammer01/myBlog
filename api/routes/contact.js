const nodemailer = require('nodemailer');
const { requireAdmin } = require('../middleware/auth');
const pool = require('../db');

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

    // 异步发送邮件通知（不阻塞响应）
    if (process.env.QQ_EMAIL_USER && process.env.QQ_EMAIL_PASS) {
      const notifyEmail = process.env.CONTACT_EMAIL || process.env.QQ_EMAIL_USER;
      transporter.sendMail({
        from: `"博客留言通知" <${process.env.QQ_EMAIL_USER}>`,
        to: notifyEmail,
        subject: `[博客留言] ${subject.trim()}`,
        html: `
          <h3>来自博客的新留言</h3>
          <p><strong>姓名：</strong>${name.trim()}</p>
          <p><strong>邮箱：</strong>${email.trim()}</p>
          <p><strong>主题：</strong>${subject.trim()}</p>
          <p><strong>内容：</strong></p>
          <blockquote>${message.trim().replace(/\n/g, '<br>')}</blockquote>
          <hr>
          <p style="color:#909399;font-size:12px">此邮件由博客系统自动发送</p>
        `,
      }).catch((err) => console.error('发送邮件通知失败:', err.message));
    }

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
