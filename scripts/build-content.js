#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- 配置区 ---
// 使用 path.resolve 确保路径在 Windows 下更稳定
const ROOT = path.resolve(__dirname, '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'articles')
const ASSETS_DIR = path.join(ROOT, 'content', 'assets')
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'articles.json')
const PUBLIC_ASSETS_DIR = path.join(ROOT, 'public', 'images')
const SITE_URL = 'https://pikachuprogrammer01.github.io/myBlog'

// --- 工具函数 ---

function copyDirSync (src, dest) {
  if (!fs.existsSync(src)) return
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })

  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

function processImagesInMarkdown (content) {
  // 修正替换逻辑：将 ../assets/ 替换为 /images/ (因为你目标目录是 public/images)
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
    if (src.includes('../assets/')) {
      const fileName = path.basename(src)
      return `![${alt}](/images/${fileName})`
    }
    return match
  })
}

function processMarkdownFile (filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: markdownContent } = matter(content)

    const processedContent = processImagesInMarkdown(markdownContent.trim())

    let cover = frontmatter.cover || '/images/article-default.jpg'
    if (cover.includes('../assets/')) {
      cover = `/images/${path.basename(cover)}`
    }

    const id = frontmatter.id || path.basename(filePath, '.md')

    // 日期处理加强：防止 frontmatter.date 格式奇怪
    let dateStr = new Date().toISOString().split('T')[0]
    if (frontmatter.date) {
      const d = new Date(frontmatter.date)
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().split('T')[0]
      }
    }

    return {
      id,
      title: frontmatter.title || id,
      date: dateStr,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : (frontmatter.tags ? [frontmatter.tags] : []),
      categories: Array.isArray(frontmatter.categories) ? frontmatter.categories : (frontmatter.categories ? [frontmatter.categories] : []),
      excerpt: frontmatter.excerpt || processedContent.replace(/[#*`!()]/g, '').replace(/[[\]]/g, '').substring(0, 100).trim() + '...',
      cover,
      published: frontmatter.published !== false,
      content: processedContent
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message)
    return null
  }
}

// --- 主逻辑 ---
async function buildContent () {
  console.log('🚀 Starting content build...')

  // 1. 确保目录存在 (放弃 forEach，改用直接调用，防止 context 丢失)
  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  if (!fs.existsSync(PUBLIC_ASSETS_DIR)) fs.mkdirSync(PUBLIC_ASSETS_DIR, { recursive: true })

  // 2. 拷贝静态资源
  console.log('📦 Syncing assets...')
  if (fs.existsSync(ASSETS_DIR)) {
    copyDirSync(ASSETS_DIR, PUBLIC_ASSETS_DIR)
  } else {
    console.warn(`⚠️  Assets directory not found: ${ASSETS_DIR}`)
  }

  // 3. 读取解析
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ Content directory not found: ${CONTENT_DIR}`)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([]))
    return
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.md'))
  const articles = files
    .map(file => processMarkdownFile(path.join(CONTENT_DIR, file)))
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // 4. 写入数据
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2))

  // 5. 生成 Sitemap
  generateSitemap(articles)

  console.log(`\n✅ Build completed! Processed ${articles.length} articles.`)
}

// 生成简单的sitemap（可选）
function generateSitemap (articles) {
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml')
  const sitemapDir = path.dirname(sitemapPath)

  if (!fs.existsSync(sitemapDir)) {
    fs.mkdirSync(sitemapDir, { recursive: true })
  }

  const today = new Date().toISOString().split('T')[0]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tools</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${SITE_URL}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  ${articles.map(article => `
  <url>
    <loc>${SITE_URL}/article/${article.id}</loc>
    <lastmod>${article.date}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`

  fs.writeFileSync(sitemapPath, sitemap)
  console.log(`- Sitemap: ${sitemapPath}`)
}

// 运行构建
buildContent().catch(error => {
  console.error('Build failed:', error)
  process.exit(1)
})