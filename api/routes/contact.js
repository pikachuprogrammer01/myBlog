const nodemailer = require('nodemailer');
const { requireAdmin, requireAuth } = require('../middleware/auth');
const pool = require('../db');

const DAILY_LIMIT = 10;

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.QQ_EMAIL_USER,
      pass: process.env.QQ_EMAIL_PASS,
    },
  });
}

async function sendNotificationEmail({ username, email, subject, message }) {
  if (!process.env.QQ_EMAIL_USER || !process.env.QQ_EMAIL_PASS) {
    console.warn('[Contact] 邮件未发送：缺少 QQ_EMAIL_USER 或 QQ_EMAIL_PASS 环境变量');
    return { sent: false, reason: '邮箱配置缺失' };
  }

  const transporter = createTransporter();
  const notifyEmail = process.env.CONTACT_EMAIL || process.env.QQ_EMAIL_USER;

  try {
    await transporter.sendMail({
      from: `"博客留言通知" <${process.env.QQ_EMAIL_USER}>`,
      to: notifyEmail,
      subject: `[博客留言] ${subject.trim()}`,
      html: `
        <h3>来自博客的新留言</h3>
        <p><strong>用户：</strong>${username}</p>
        <p><strong>邮箱：</strong>${email || '未知'}</p>
        <p><strong>主题：</strong>${subject.trim()}</p>
        <p><strong>内容：</strong></p>
        <blockquote>${message.trim().replace(/\n/g, '<br>')}</blockquote>
        <hr>
        <p style="color:#909399;font-size:12px">此邮件由博客系统自动发送</p>
      `,
    });
    console.log(`[Contact] 邮件通知已发送至 ${notifyEmail}`);
    return { sent: true };
  } catch (err) {
    console.error('[Contact] 发送邮件通知失败:', err.message, err.code || '');
    return { sent: false, reason: err.message };
  }
}

// POST /api/contact — 提交联系表单（需登录，每人每天最多 10 条）
async function submitContact(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

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
    // 节流：按用户身份限流，每人每天最多 DAILY_LIMIT 条
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

    // 发送邮件通知
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
    console.error('[Contact] 获取联系消息失败:', error);
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
    console.error('[Contact] 标记已读失败:', error);
    return res.status(500).json({ success: false, message: '操作失败' });
  }
}

// GET /api/contact/remaining — 查询今日剩余可发送次数
async function getRemaining(req, res) {
  const user = await requireAuth(req, res);
  if (!user) return;

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
}

// POST /api/admin/email-test — 测试邮件发送配置（管理员）
async function testEmailConfig(req, res) {
  const user = await requireAdmin(req, res);
  if (!user) return;

  if (!process.env.QQ_EMAIL_USER || !process.env.QQ_EMAIL_PASS) {
    return res.status(400).json({
      success: false,
      message: '邮箱配置不完整，请在 Vercel 环境变量中设置 QQ_EMAIL_USER 和 QQ_EMAIL_PASS',
      missing: [
        !process.env.QQ_EMAIL_USER && 'QQ_EMAIL_USER',
        !process.env.QQ_EMAIL_PASS && 'QQ_EMAIL_PASS',
      ].filter(Boolean),
    });
  }

  const transporter = createTransporter();

  try {
    // 验证 SMTP 连接
    await transporter.verify();
    console.log('[Contact] SMTP 连接验证成功');
  } catch (err) {
    console.error('[Contact] SMTP 连接验证失败:', err.message, err.code || '');
    return res.status(500).json({
      success: false,
      message: `SMTP 连接失败: ${err.message}`,
      code: err.code || 'UNKNOWN',
    });
  }

  // 发送测试邮件
  const testEmail = process.env.CONTACT_EMAIL || process.env.QQ_EMAIL_USER;
  try {
    await transporter.sendMail({
      from: `"博客系统测试" <${process.env.QQ_EMAIL_USER}>`,
      to: testEmail,
      subject: '[博客系统] 邮件发送测试',
      html: `
        <h3>邮件发送测试</h3>
        <p>如果您收到此邮件，说明邮箱配置正确。</p>
        <p><strong>发送时间：</strong>${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
        <p><strong>发件人：</strong>${process.env.QQ_EMAIL_USER}</p>
        <p><strong>通知接收邮箱：</strong>${testEmail}</p>
        <hr>
        <p style="color:#909399;font-size:12px">此邮件由博客系统自动发送</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: `测试邮件已发送至 ${testEmail}，请检查邮箱（含垃圾箱）`,
    });
  } catch (err) {
    console.error('[Contact] 测试邮件发送失败:', err.message, err.code || '');
    return res.status(500).json({
      success: false,
      message: `邮件发送失败: ${err.message}`,
      code: err.code || 'UNKNOWN',
    });
  }
}

module.exports = { submitContact, getContactMessages, markRead, getRemaining, testEmailConfig };
