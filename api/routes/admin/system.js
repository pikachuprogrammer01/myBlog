const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [[{ total: totalUsers }]] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const [[{ total: totalComments }]] = await pool.execute('SELECT COUNT(*) as total FROM comments WHERE is_deleted = 0');
    const [[{ total: totalArticles }]] = await pool.execute('SELECT COUNT(*) as total FROM articles');
    const [[{ total: totalViews }]] = await pool.execute('SELECT COALESCE(SUM(view_count), 0) as total FROM articles');

    return res.status(200).json({
      success: true,
      data: {
        totalArticles: Number(totalArticles),
        totalComments: Number(totalComments),
        totalUsers: Number(totalUsers),
        totalViews: Number(totalViews),
      },
    });
  } catch (error) {
    console.error('获取管理统计失败:', error);
    return res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

// POST /api/admin/reset
router.post('/reset', async (req, res) => {
  try {
    await pool.execute('UPDATE comments SET is_deleted = 1');
    await pool.execute('DELETE FROM article_likes');
    await pool.execute('DELETE FROM comment_likes');
    await pool.execute('DELETE FROM bookmarks');
    await pool.execute('DELETE FROM contact_messages');

    return res.status(200).json({
      success: true,
      message: '系统数据已重置（用户和文章已保留）',
    });
  } catch (error) {
    console.error('重置系统数据失败:', error);
    return res.status(500).json({ success: false, message: '重置系统数据失败' });
  }
});

// POST /api/admin/email-test
router.post('/email-test', async (req, res) => {
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

  const { createTransporter } = require('../../utils/mail');
  const transporter = createTransporter();

  try {
    await transporter.verify();
  } catch (err) {
    console.error('[Contact] SMTP 连接验证失败:', err.message, err.code || '');
    return res.status(500).json({
      success: false,
      message: `SMTP 连接失败: ${err.message}`,
      code: err.code || 'UNKNOWN',
    });
  }

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
});

module.exports = router;
