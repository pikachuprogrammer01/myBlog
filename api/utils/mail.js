const nodemailer = require('nodemailer');

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

module.exports = { createTransporter, sendNotificationEmail };
