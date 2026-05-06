#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'articles');
const OUTPUT_FILE = path.join(ROOT, 'api', 'articles-seed.sql');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^一-龥a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

function escapeSQL(str) {
  if (str == null) return 'NULL';
  return "'" + String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
}

function processArticle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    let date = new Date().toISOString().split('T')[0];
    if (data.date) {
      const d = new Date(data.date);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0];
      }
    }

    const tags = Array.isArray(data.tags)
      ? data.tags
      : data.tags
        ? [data.tags]
        : data.tag
          ? (Array.isArray(data.tag) ? data.tag : [data.tag])
          : [];

    // Handle both 'category' (singular, used by most articles) and 'categories' (plural)
    let cats = [];
    if (Array.isArray(data.categories)) {
      cats = data.categories;
    } else if (data.categories) {
      cats = [data.categories];
    } else if (Array.isArray(data.category)) {
      cats = data.category;
    } else if (data.category) {
      cats = [data.category];
    }

    let cover = data.cover || null;
    if (cover && cover.includes('../assets/')) {
      cover = '/images/' + path.basename(cover);
    }

    return {
      title: data.title || path.basename(filePath, '.md'),
      slug: data.id || path.basename(filePath, '.md'),
      content: content.trim(),
      summary: data.excerpt || data.description || content.trim().replace(/[#*`!()\n]/g, '').replace(/[[\]]/g, '').substring(0, 150),
      cover_image: cover,
      tags: tags,
      categories: cats.length > 0 ? cats : ['未分类'],
      date: date,
      status: data.published !== false ? 'published' : 'draft',
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));
  const articles = files
    .map((f) => processArticle(path.join(CONTENT_DIR, f)))
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Collect unique categories
  const categoryMap = new Map();
  articles.forEach((a) => {
    a.categories.forEach((name) => {
      const slug = slugify(name);
      if (!categoryMap.has(slug)) {
        categoryMap.set(slug, { name, slug });
      }
    });
  });

  const sqlLines = [];
  sqlLines.push('-- ============================================');
  sqlLines.push('-- 文章种子数据 (自动生成)');
  sqlLines.push(`-- 生成时间: ${new Date().toISOString()}`);
  sqlLines.push(`-- 文章数: ${articles.length}  分类数: ${categoryMap.size}`);
  sqlLines.push('-- ============================================');
  sqlLines.push('');

  // Categories INSERT
  sqlLines.push('-- 分类');
  for (const [slug, cat] of categoryMap) {
    sqlLines.push(
      `INSERT INTO categories (name, slug) VALUES (${escapeSQL(cat.name)}, ${escapeSQL(slug)}) ON DUPLICATE KEY UPDATE name = VALUES(name);`
    );
  }
  sqlLines.push('');

  // Articles INSERT — each wrapped to set @category_id via subquery
  sqlLines.push('-- 文章');
  articles.forEach((a) => {
    const firstCat = a.categories[0] ? slugify(a.categories[0]) : null;
    const tagJSON = a.tags.length > 0 ? JSON.stringify(a.tags) : 'NULL';
    const catExpr = firstCat
      ? `(SELECT id FROM categories WHERE slug = ${escapeSQL(firstCat)} LIMIT 1)`
      : 'NULL';

    sqlLines.push(
      `INSERT INTO articles (title, slug, content, summary, cover_image, category_id, tags, status, created_at) VALUES (`
    );
    sqlLines.push(
      `  ${escapeSQL(a.title)}, ${escapeSQL(a.slug)}, ${escapeSQL(a.content)}, ${escapeSQL(a.summary)},`
    );
    sqlLines.push(
      `  ${escapeSQL(a.cover_image)}, ${catExpr}, ${tagJSON !== 'NULL' ? escapeSQL(tagJSON) : 'NULL'},`
    );
    sqlLines.push(
      `  ${escapeSQL(a.status)}, ${escapeSQL(a.date)}`
    );
    sqlLines.push(`) ON DUPLICATE KEY UPDATE title = VALUES(title), summary = VALUES(summary);`);
    sqlLines.push('');
  });

  const sql = sqlLines.join('\n');
  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log(`✅ 已生成: ${OUTPUT_FILE}`);
  console.log(`   文章 ${articles.length} 篇, 分类 ${categoryMap.size} 个`);
}

main();
