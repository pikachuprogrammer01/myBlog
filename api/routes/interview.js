const express = require('express');
const router = express.Router();
const pool = require('../db');

let tableReady = false;
let seeded = false;

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

const CATEGORY_LABELS = {
  js: 'JavaScript',
  vue: 'Vue.js',
  css: 'CSS',
  algorithm: '算法',
  engineering: '工程化',
  project: '项目经验',
};

const SEED_QUESTIONS = [
  // JS
  { title: '请解释 JavaScript 中的闭包', category: 'js', difficulty: 'medium', tags: '闭包,作用域,执行上下文', summary: '闭包是 JS 中函数与其词法环境的引用绑定，常用于数据封装和模块化。',
    content: `## 闭包（Closure）\n\n闭包是指一个函数能够记住并访问其词法作用域，即使该函数在其词法作用域之外执行。\n\n\`\`\`javascript\nfunction outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    return count;\n  };\n}\nconst counter = outer();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n\`\`\`\n\n### 应用场景\n- 数据私有化 / 模块模式\n- 函数工厂（currying）\n- 事件处理回调\n- setTimeout / setInterval\n\n### 注意事项\n- 闭包会导致内存占用，不再使用时设为 null 释放引用` },
  { title: '说说 JS 的事件循环机制', category: 'js', difficulty: 'hard', tags: '事件循环,宏任务,微任务,Promise', summary: '事件循环是 JS 异步编程的核心，包含调用栈、任务队列和微任务队列。',
    content: `## 事件循环（Event Loop）\n\nJS 是单线程语言，通过事件循环实现异步非阻塞。\n\n### 执行流程\n1. 执行同步代码（调用栈）\n2. 调用栈为空时，检查微任务队列\n3. 执行所有微任务（Promise.then、MutationObserver）\n4. 取一个宏任务执行（setTimeout、I/O）\n5. 重复步骤 2-4\n\n\`\`\`javascript\nconsole.log('1'); // 同步\nsetTimeout(() => console.log('2'), 0); // 宏任务\nPromise.resolve().then(() => console.log('3')); // 微任务\nconsole.log('4'); // 同步\n// 输出: 1 4 3 2\n\`\`\`\n\n### 宏任务 vs 微任务\n| 宏任务 | 微任务 |\n|--------|--------|\n| setTimeout | Promise.then |\n| setInterval | async/await |\n| I/O | queueMicrotask |` },

  // Vue
  { title: 'Vue 3 响应式原理是什么', category: 'vue', difficulty: 'medium', tags: '响应式,Proxy,ref,reactive', summary: 'Vue 3 使用 Proxy 替代 Object.defineProperty 实现响应式，支持深层监听和数组索引。',
    content: `## Vue 3 响应式原理\n\nVue 3 使用 ES6 的 **Proxy** 对象拦截数据的读取和修改操作。\n\n\`\`\`javascript\nfunction reactive(target) {\n  return new Proxy(target, {\n    get(target, key, receiver) {\n      track(target, key); // 依赖收集\n      return Reflect.get(target, key, receiver);\n    },\n    set(target, key, value, receiver) {\n      const result = Reflect.set(target, key, value, receiver);\n      trigger(target, key); // 触发更新\n      return result;\n    }\n  });\n}\n\`\`\`\n\n### 与 Vue 2 的区别\n| Vue 2 | Vue 3 |\n|-------|-------|\n| Object.defineProperty | Proxy |\n| 无法检测属性添加/删除 | 支持 |\n| 无法检测数组索引 | 支持 |\n| 递归遍历所有属性 | 懒代理（用到才代理） |` },
  { title: 'computed 和 watch 有什么区别', category: 'vue', difficulty: 'easy', tags: 'computed,watch,响应式', summary: 'computed 用于派生数据（缓存），watch 用于监听数据变化并执行副作用。',
    content: `## computed vs watch\n\n### computed（计算属性）\n- 基于依赖缓存，依赖不变不会重新计算\n- 返回一个值，用于模板渲染\n- 不能执行异步操作\n\n\`\`\`javascript\nconst fullName = computed(() => firstName.value + ' ' + lastName.value);\n\`\`\`\n\n### watch（侦听器）\n- 监听数据变化，执行副作用\n- 可以执行异步操作\n- 可访问新旧值\n\n\`\`\`javascript\nwatch(query, async (newVal) => {\n  const result = await fetch('/api/search?q=' + newVal);\n  results.value = result.data;\n});\n\`\`\`\n\n### 选择建议\n- 需要派生值 → computed\n- 需要执行异步/副作用 → watch` },

  // CSS
  { title: '请描述 Flex 布局的核心属性', category: 'css', difficulty: 'easy', tags: 'Flex,布局,对齐', summary: 'Flex 布局分为容器属性和项目属性，可实现灵活的响应式布局。',
    content: `## Flex 布局\n\nFlex 布局提供了一种更高效的排列、对齐和分配空间的方式。\n\n### 容器属性\n| 属性 | 说明 |\n|------|------|\n| flex-direction | 主轴方向 |\n| justify-content | 主轴对齐 |\n| align-items | 交叉轴对齐 |\n| flex-wrap | 是否换行 |\n\n### 项目属性\n| 属性 | 说明 |\n|------|------|\n| flex-grow | 放大比例 |\n| flex-shrink | 缩小比例 |\n| flex-basis | 初始大小 |\n| align-self | 单项目对齐 |\n\n\`\`\`css\n.container {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.item {\n  flex: 1; /* flex-grow: 1; flex-shrink: 1; flex-basis: 0% */\n}\n\`\`\`` },
  { title: 'CSS 实现水平垂直居中的 5 种方案', category: 'css', difficulty: 'medium', tags: '居中,布局,Flex,Grid', summary: '从传统定位到现代布局，多种居中方案适用于不同场景。',
    content: `## CSS 水平垂直居中\n\n### 1. Flex\n\`\`\`css\n.parent { display: flex; justify-content: center; align-items: center; }\n\`\`\`\n\n### 2. Grid\n\`\`\`css\n.parent { display: grid; place-items: center; }\n\`\`\`\n\n### 3. 绝对定位 + Transform\n\`\`\`css\n.child {\n  position: absolute; top: 50%; left: 50%;\n  transform: translate(-50%, -50%);\n}\n\`\`\`\n\n### 4. 绝对定位 + Margin Auto\n\`\`\`css\n.child {\n  position: absolute; top: 0; left: 0; right: 0; bottom: 0;\n  margin: auto;\n}\n\`\`\`\n\n### 5. Table Cell\n\`\`\`css\n.parent { display: table-cell; vertical-align: middle; text-align: center; }\n\`\`\`\n\n推荐使用 **Flex** 或 **Grid**，代码简洁且语义清晰。` },

  // Algorithm
  { title: '力扣第一题：两数之和', category: 'algorithm', difficulty: 'easy', tags: '哈希表,数组,双指针', summary: '在数组中找到两个数之和等于目标值，返回下标。时间复杂度 O(n) 的哈希表解法。',
    content: `## 两数之和\n\n给定一个整数数组 nums 和一个目标值 target，找出数组中和为目标值的两个数的下标。\n\n### 哈希表解法 O(n)\n\`\`\`javascript\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}\n\`\`\`\n\n### 复杂度\n- 时间: O(n)，遍历一次\n- 空间: O(n)，哈希表存储\n\n### 关键点\n- 边遍历边查找补数\n- 哈希表存储 "值 → 下标" 映射` },
  { title: '单链表的反转', category: 'algorithm', difficulty: 'medium', tags: '链表,指针,迭代,递归', summary: '反转单链表是链表操作的基础题，需要理解指针操作。',
    content: `## 反转链表\n\n### 迭代法\n\`\`\`javascript\nfunction reverseList(head) {\n  let prev = null;\n  let curr = head;\n  while (curr) {\n    const next = curr.next; // 暂存下一个\n    curr.next = prev;        // 反转指针\n    prev = curr;             // prev 前进\n    curr = next;             // curr 前进\n  }\n  return prev;\n}\n\`\`\`\n\n### 递归法\n\`\`\`javascript\nfunction reverseList(head) {\n  if (!head || !head.next) return head;\n  const newHead = reverseList(head.next);\n  head.next.next = head;\n  head.next = null;\n  return newHead;\n}\n\`\`\`\n\n### 关键步骤\n1. 保存下一个节点\n2. 反转当前节点指针\n3. 向前移动指针` },

  // Engineering
  { title: 'Webpack 的打包原理', category: 'engineering', difficulty: 'hard', tags: 'Webpack,打包,模块化,AST', summary: 'Webpack 从入口出发构建依赖图，通过 Loader 和 Plugin 处理模块，最终输出打包文件。',
    content: `## Webpack 打包原理\n\nWebpack 是一个模块打包工具，将各种资源视为模块，从入口开始构建依赖图。\n\n### 核心流程\n1. **解析入口** — 读取 entry 配置\n2. **构建依赖图** — 递归解析 require/import\n3. **Loader 转换** — 将非 JS 文件转为 JS 模块\n4. **Plugin 介入** — 在构建各阶段执行自定义逻辑\n5. **输出 Bundle** — 生成优化后的打包文件\n\n### Loader vs Plugin\n| Loader | Plugin |\n|--------|--------|\n| 文件转换 | 构建流程扩展 |\n| 对单个文件操作 | 对整个构建过程 |\n| 链式调用 | 基于事件/钩子 |\n\n\`\`\`javascript\n// 简易 bundler 核心逻辑\nfunction bundle(entry) {\n  const modules = {};\n  function parseModule(file) {\n    const code = fs.readFileSync(file, 'utf-8');\n    const deps = [];\n    const ast = parser.parse(code);\n    traverse(ast, { /* 收集依赖 */ });\n    modules[file] = { code, deps };\n    deps.forEach(dep => parseModule(dep));\n  }\n  parseModule(entry);\n  return generate(modules);\n}\n\`\`\`` },
  { title: '什么是 Tree Shaking', category: 'engineering', difficulty: 'medium', tags: 'Tree Shaking,ESM,死代码,优化', summary: 'Tree Shaking 通过静态分析 ES Module 的导入导出，移除未使用的代码。',
    content: `## Tree Shaking\n\nTree Shaking 是一种通过静态分析移除未引用代码的优化技术。\n\n### 实现原理\n- 基于 ES Module 的静态结构（import/export 在编译时确定）\n- Webpack/Rollup 通过分析模块依赖，标记未使用的导出\n- Terser 等压缩工具删除标记的代码\n\n### 必要条件\n1. 使用 ES Module（不能用 CommonJS）\n2. package.json 中设置 \`"sideEffects": false\`\n3. 生产模式构建\n\n\`\`\`javascript\n// math.js\nexport function add(a, b) { return a + b; }  // 被使用\nexport function sub(a, b) { return a - b; }  // 未使用 → 被移除\n\n// index.js\nimport { add } from './math';  // 只导入 add\nconsole.log(add(1, 2));\n\`\`\`` },

  // Project
  { title: '前端常见性能优化策略', category: 'project', difficulty: 'medium', tags: '性能优化,缓存,懒加载,CDN', summary: '从网络、渲染、代码三个层面介绍前端性能优化的常用方法。',
    content: `## 前端性能优化\n\n### 网络层面\n- **CDN 加速** — 静态资源使用 CDN 分发\n- **HTTP 缓存** — 强缓存 + 协商缓存\n- **压缩** — Gzip/Brotli 压缩资源\n- **图片优化** — WebP 格式、懒加载、响应式图片\n\n### 渲染层面\n- **减少重排重绘** — 批量修改 DOM、使用 transform\n- **虚拟列表** — 长列表仅渲染可视区域\n- **骨架屏** — 提升用户感知速度\n\n### 代码层面\n- **路由懒加载** — \`() => import('./Page.vue')\`\n- **Tree Shaking** — 移除死代码\n- **防抖节流** — 控制高频事件触发频率\n- **Web Worker** — 将计算密集型任务放入后台线程\n\n\`\`\`javascript\n// 防抖\nfunction debounce(fn, delay) {\n  let timer;\n  return (...args) => {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\`\`\`` },
  { title: '前端权限系统如何设计', category: 'project', difficulty: 'hard', tags: '权限,RBAC,路由守卫,动态路由', summary: '基于 RBAC 模型，通过动态路由 + 指令权限 + 接口鉴权实现完整权限控制。',
    content: `## 权限系统设计\n\n### RBAC 模型\n- **用户** → 拥有角色\n- **角色** → 拥有权限\n- **权限** → 控制资源访问\n\n### 实现方案\n\n#### 1. 路由权限\n\`\`\`javascript\n// 动态路由注册\nrouter.beforeEach(async (to, from) => {\n  if (!store.hasRoutes) {\n    const routes = await fetchUserRoutes();  // 从后端获取\n    routes.forEach(r => router.addRoute(r));\n    return to.fullPath;  // 重试\n  }\n  if (!hasPermission(to.meta.permission)) return '/403';\n});\n\`\`\`\n\n#### 2. 按钮权限\n通过自定义指令控制按钮显隐：\n\`\`\`vue\n<el-button v-permission="'user:delete'">删除</el-button>\n\`\`\`\n\n#### 3. 接口鉴权\n后端中间件校验 JWT + 角色权限，前端不在必要时可考虑 401 统一处理。` },
];

async function seedDefaultQuestions() {
  if (seeded) return;
  const [rows] = await pool.execute('SELECT COUNT(*) as cnt FROM interview_questions');
  if (rows[0].cnt > 0) { seeded = true; return; }

  for (const q of SEED_QUESTIONS) {
    const [result] = await pool.execute(
      'INSERT INTO interview_questions (title, category, difficulty, summary, content) VALUES (?, ?, ?, ?, ?)',
      [q.title, q.category, q.difficulty, q.summary, q.content]
    );
    const questionId = result.insertId;
    const tags = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
    for (const tag of tags) {
      await pool.execute(
        'INSERT IGNORE INTO interview_question_tags (question_id, tag_name) VALUES (?, ?)',
        [questionId, tag]
      );
      const slug = tag.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9\\-_一-龥]/g, '');
      await pool.execute(
        'INSERT IGNORE INTO tags (name, slug) VALUES (?, ?)',
        [tag, slug]
      );
    }
  }
  seeded = true;
  console.log(`[Interview] 已插入 ${SEED_QUESTIONS.length} 条种子题目`);
}

// GET /api/interview/categories — category summary with counts
router.get('/categories', async (req, res) => {
  try {
    await ensureTable();
    await seedDefaultQuestions();
    const [rows] = await pool.execute(
      `SELECT category, COUNT(*) as count,
        SUM(CASE WHEN difficulty = 'easy' THEN 1 ELSE 0 END) as easy,
        SUM(CASE WHEN difficulty = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN difficulty = 'hard' THEN 1 ELSE 0 END) as hard
      FROM interview_questions GROUP BY category`
    );

    const catOrder = ['js', 'vue', 'css', 'algorithm', 'engineering', 'project'];
    const result = catOrder.map((cat) => {
      const found = rows.find((r) => r.category === cat);
      return {
        category: cat,
        label: CATEGORY_LABELS[cat],
        count: found ? Number(found.count) : 0,
        easy: found ? Number(found.easy) : 0,
        medium: found ? Number(found.medium) : 0,
        hard: found ? Number(found.hard) : 0,
      };
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Interview] 获取分类失败:', error);
    return res.status(500).json({ success: false, message: '获取分类失败' });
  }
});

// GET /api/interview/questions — filtered list with pagination
router.get('/questions', async (req, res) => {
  try {
    await ensureTable();

    const category = req.query.category;
    if (!category) {
      return res.status(400).json({ success: false, message: '请选择分类' });
    }

    const page = parseInt(req.query.page) || 1;
    const rawLimit = parseInt(req.query.limit) || 10;
    const limit = Math.min(100, Math.max(1, rawLimit));
    const offset = Math.max(0, (page - 1) * limit);
    const difficulty = req.query.difficulty;

    let where = 'WHERE q.category = ?';
    const params = [category];

    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
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

    // Fetch tags for each question
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
    console.error('[Interview] 获取题目列表失败:', error);
    return res.status(500).json({ success: false, message: '获取题目列表失败' });
  }
});

// GET /api/interview/questions/:id — detail
router.get('/questions/:id', async (req, res) => {
  try {
    await ensureTable();

    const id = parseInt(req.params.id);
    const [rows] = await pool.execute(
      'SELECT * FROM interview_questions WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '题目不存在' });
    }

    const question = rows[0];

    // Increment view count
    await pool.execute(
      'UPDATE interview_questions SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    // Fetch tags
    const [tagRows] = await pool.execute(
      'SELECT tag_name FROM interview_question_tags WHERE question_id = ?',
      [id]
    );
    question.tags = tagRows.map((t) => t.tag_name);

    // Related questions: same category, different id, top 5 by view_count
    const [related] = await pool.execute(
      `SELECT id, title, category, difficulty, view_count
      FROM interview_questions
      WHERE category = ? AND id != ?
      ORDER BY view_count DESC
      LIMIT 5`,
      [question.category, id]
    );

    return res.status(200).json({
      success: true,
      data: { ...question, related },
    });
  } catch (error) {
    console.error('[Interview] 获取题目详情失败:', error);
    return res.status(500).json({ success: false, message: '获取题目详情失败' });
  }
});

module.exports = router;
