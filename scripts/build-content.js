#!/usr/bin/env node

/**
 * 文章内容构建脚本
 * 将Markdown文件转换为JSON数据
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'
import { marked } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'articles')
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'articles.json')
const SITE_URL = 'https://your-username.github.io/myBlog'

// 确保输出目录存在
const outputDir = path.dirname(OUTPUT_FILE)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 处理单个Markdown文件
function processMarkdownFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data: frontmatter, content: markdownContent } = matter(content)

    // 基本验证
    if (!frontmatter.id) {
      const fileName = path.basename(filePath, '.md')
      frontmatter.id = fileName
    }

    if (!frontmatter.title) {
      frontmatter.title = frontmatter.id
    }

    if (!frontmatter.date) {
      frontmatter.date = new Date().toISOString().split('T')[0]
    }

    if (!frontmatter.tags) {
      frontmatter.tags = []
    }

    if (!frontmatter.categories) {
      frontmatter.categories = []
    }

    if (!frontmatter.excerpt) {
      // 从内容生成摘要
      const plainText = markdownContent
        .replace(/[#*`]/g, '')
        .replace(/\n/g, ' ')
        .trim()
      frontmatter.excerpt = plainText.substring(0, 100) + '...'
    }

    if (!frontmatter.cover) {
      frontmatter.cover = `/images/article-default.jpg`
    }

    if (frontmatter.published === undefined) {
      frontmatter.published = true
    }

    // 格式化日期为YYYY-MM-DD
    let formattedDate = frontmatter.date
    if (formattedDate instanceof Date) {
      formattedDate = formattedDate.toISOString().split('T')[0]
    } else if (typeof formattedDate === 'string') {
      // 尝试解析字符串日期
      const date = new Date(formattedDate)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0]
      }
    }

    // 转换Markdown为HTML（如果使用Markdown渲染器，可以存储原始Markdown）
    // 这里我们存储原始Markdown，让前端渲染
    const article = {
      id: frontmatter.id,
      title: frontmatter.title,
      date: formattedDate,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags],
      categories: Array.isArray(frontmatter.categories) ? frontmatter.categories : [frontmatter.categories],
      excerpt: frontmatter.excerpt,
      cover: frontmatter.cover,
      published: Boolean(frontmatter.published),
      content: markdownContent.trim()
    }

    console.log(`Processed: ${article.id}`)
    return article
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
    return null
  }
}

// 主构建函数
async function buildContent() {
  console.log('Starting content build...')

  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`)
    console.log('Creating empty articles array...')
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2))
    return
  }

  const files = fs.readdirSync(CONTENT_DIR)
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(CONTENT_DIR, file))

  if (files.length === 0) {
    console.warn('No Markdown files found in content directory')
    console.log('Creating empty articles array...')
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2))
    return
  }

  const articles = []

  for (const filePath of files) {
    const article = processMarkdownFile(filePath)
    if (article) {
      articles.push(article)
    }
  }

  // 按日期倒序排序
  articles.sort((a, b) => new Date(b.date) - new Date(a.date))

  // 写入JSON文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(articles, null, 2))

  console.log(`\nBuild completed!`)
  console.log(`- Processed ${articles.length} articles`)
  console.log(`- Output: ${OUTPUT_FILE}`)

  // 生成sitemap（可选）
  generateSitemap(articles)
}

// 生成简单的sitemap（可选）
function generateSitemap(articles) {
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