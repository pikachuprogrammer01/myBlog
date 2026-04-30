const bcrypt = require('bcryptjs');
const pool = require('./db');

const SALT_ROUNDS = 10;

const seedUsers = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'user1', password: 'user123', role: 'user' },
  { username: 'user2', password: 'user456', role: 'user' },
];

async function seed() {
  try {
    console.log('开始导入初始数据...\n');

    // 导入用户
    for (const u of seedUsers) {
      const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

      await pool.execute(
        `INSERT INTO users (username, password_hash, role)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE username = username`,
        [u.username, passwordHash, u.role]
      );
      console.log(`  用户已创建: ${u.username} (${u.role})`);
    }

    // 导入分类
    const categories = [
      { name: '前端开发', slug: 'frontend', description: 'Vue、React、CSS 等前端技术' },
      { name: '后端开发', slug: 'backend', description: 'Node.js、数据库、API 设计' },
      { name: 'Java', slug: 'java', description: 'Java 基础、框架、JVM' },
      { name: '教程', slug: 'tutorial', description: '各类技术教程与指南' },
    ];

    for (const cat of categories) {
      await pool.execute(
        `INSERT INTO categories (name, slug, description)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [cat.name, cat.slug, cat.description]
      );
      console.log(`  分类已创建: ${cat.name}`);
    }

    console.log('\n初始数据导入完成！');
    process.exit(0);
  } catch (error) {
    console.error('导入失败:', error);
    process.exit(1);
  }
}

seed();
