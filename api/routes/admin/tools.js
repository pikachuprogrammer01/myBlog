const express = require('express');
const router = express.Router();
const pool = require('../../db');
const { requireAdminMw } = require('../../middleware/auth');

router.use(requireAdminMw);

let tableReady = false;

async function ensureTable() {
  if (tableReady) return;
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS tools (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      url VARCHAR(500),
      icon VARCHAR(500),
      category VARCHAR(100) DEFAULT '其他',
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  tableReady = true;
}

const DEFAULT_TOOLS = [
  ['Vue.js', '渐进式 JavaScript 框架，本项目核心技术。', 'https://vuejs.org/', 'https://vuejs.org/logo.svg', '前端工具', 1],
  ['Element Plus', '基于 Vue 3，面向设计师和开发者的组件库。', 'https://element-plus.org/', 'https://element-plus.org/images/element-plus-logo-small.svg', '前端工具', 2],
  ['MDN Web Docs', '最权威的 Web 开发技术文档，自学必备。', 'https://developer.mozilla.org/', 'https://developer.mozilla.org/favicon-48x48.png', '学习社区', 3],
  ['Can I Use', '查询浏览器对前端特性的兼容性支持情况。', 'https://caniuse.com/', 'https://caniuse.com/img/favicon-128.png', '前端工具', 4],
  ['Unsplash', '免费的高质量摄影图片库，适合找博客配图。', 'https://unsplash.com/', 'https://unsplash.com/favicon-32x32.png', '设计资源', 5],
  ['Iconify', '统一的图标框架，可轻松使用数千个图标。', 'https://icon-sets.iconify.design/', 'https://icon-sets.iconify.design/favicon.ico', '设计资源', 6],
  ['Spring Initializr', '快速生成 Spring Boot 项目骨架的官方神器。', 'https://start.spring.io/', 'https://spring.io/favicon.svg', 'Java/后端', 7],
  ['Maven Repository', 'Java 依赖包查询库，配置 pom.xml 的必备站点。', 'https://mvnrepository.com/', 'https://mvnrepository.com/favicon.ico', 'Java/后端', 8],
  ['Hutool', '一个让 Java 变得甜甜的工具库，大大简化代码。', 'https://hutool.cn/', 'https://plus.hutool.cn/images/logo.png', 'Java/后端', 9],
  ['Postman', '接口调试利器，前后端联调的桥梁。', 'https://www.postman.com/', 'https://www.postman.com/favicon.ico', '开发辅助', 10],
  ['JSON 格式化', '在线解析和美化 JSON 数据，后端接口联调必备。', 'https://www.json.cn/', 'https://www.json.cn/favicon.ico', '开发辅助', 11],
];

async function seedDefaultTools() {
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM tools');
  if (rows[0].cnt > 0) return;
  for (const t of DEFAULT_TOOLS) {
    await pool.execute(
      'INSERT INTO tools (name, description, url, icon, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      t
    );
  }
}

// GET /
router.get('/', async (req, res) => {
  try {
    await ensureTable();
    await seedDefaultTools();
    const [rows] = await pool.execute('SELECT * FROM tools ORDER BY sort_order, id');
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('[Tools] 获取工具列表失败:', error);
    return res.status(500).json({ success: false, message: '获取工具列表失败' });
  }
});

// POST /
router.post('/', async (req, res) => {
  const { name, description, url, icon, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '工具名称不能为空' });
  }
  if (!url || !url.trim()) {
    return res.status(400).json({ success: false, message: '工具链接不能为空' });
  }

  try {
    await ensureTable();
    const [result] = await pool.execute(
      'INSERT INTO tools (name, description, url, icon, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), description || '', url.trim(), icon || '', category || '其他', sort_order || 0]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId, name: name.trim() } });
  } catch (error) {
    console.error('[Tools] 创建工具失败:', error);
    return res.status(500).json({ success: false, message: '创建工具失败' });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, url, icon, category, sort_order } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: '工具名称不能为空' });
  }

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM tools WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    await pool.execute(
      'UPDATE tools SET name = ?, description = ?, url = ?, icon = ?, category = ?, sort_order = ? WHERE id = ?',
      [name.trim(), description || '', url || '', icon || '', category || '其他', sort_order || 0, id]
    );
    return res.status(200).json({ success: true, message: '工具已更新' });
  } catch (error) {
    console.error('[Tools] 更新工具失败:', error);
    return res.status(500).json({ success: false, message: '更新工具失败' });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await ensureTable();
    const [rows] = await pool.execute('SELECT id FROM tools WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '工具不存在' });
    }

    await pool.execute('DELETE FROM tools WHERE id = ?', [id]);
    return res.status(200).json({ success: true, message: '工具已删除' });
  } catch (error) {
    console.error('[Tools] 删除工具失败:', error);
    return res.status(500).json({ success: false, message: '删除工具失败' });
  }
});

module.exports = router;
