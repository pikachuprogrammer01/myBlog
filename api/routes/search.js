const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY;
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

// Module-level cache for JSON fallback (loaded once per cold start)
let cachedEmbeddings = null;
let cachedArticles = null;

function loadEmbeddings() {
  if (cachedEmbeddings) return cachedEmbeddings;
  try {
    const filePath = path.join(__dirname, '..', 'data', 'article-embeddings.json');
    if (!fs.existsSync(filePath)) return null;
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    cachedEmbeddings = new Map(raw.map((e) => [e.id, e.embedding]));
    return cachedEmbeddings;
  } catch {
    return null;
  }
}

function loadArticles() {
  if (cachedArticles) return cachedArticles;
  try {
    const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'articles.json');
    if (!fs.existsSync(filePath)) return [];
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    cachedArticles = raw.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.date,
      tags: a.tags || [],
      categories: a.categories || [],
      excerpt: a.excerpt || '',
      cover: a.cover,
    }));
    return cachedArticles;
  } catch {
    return [];
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// Primary: TiDB vector search. Fallback: JSON in-memory.
async function searchViaTiDB(queryEmbedding, topK) {
  const vecStr = JSON.stringify(queryEmbedding);
  const limit = Number(topK) || 10;
  const [rows] = await pool.execute(
    `SELECT slug, title, created_at, tags, summary, cover_image,
            VEC_COSINE_DISTANCE(embedding, ?) AS distance
     FROM articles
     WHERE status = 'published' AND embedding IS NOT NULL
     ORDER BY distance
     LIMIT ${limit}`,
    [vecStr],
  );

  return rows.map((r) => ({
    id: r.slug,
    title: r.title,
    date: r.created_at,
    tags: Array.isArray(r.tags) ? r.tags : [],
    categories: [],
    excerpt: r.summary || '',
    cover: r.cover_image,
    score: Math.round((1 - r.distance) * 10000) / 10000, // cosine similarity = 1 - distance
  }));
}

function searchViaJSON(queryEmbedding, topK) {
  const embeddings = loadEmbeddings();
  const articles = loadArticles();
  const ranked = [];

  for (const article of articles) {
    const emb = embeddings.get(article.id);
    if (!emb) continue;
    ranked.push({
      id: article.id,
      title: article.title,
      date: article.date,
      tags: article.tags,
      categories: article.categories,
      excerpt: article.excerpt,
      cover: article.cover,
      score: Math.round(cosineSimilarity(queryEmbedding, emb) * 10000) / 10000,
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, topK);
}

// POST /api/search
router.post('/', async (req, res) => {
  const { query, topK = 10 } = req.body || {};

  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: '请输入搜索关键词' });
  }

  if (!EMBEDDING_API_KEY) {
    return res.status(503).json({
      success: false,
      message: '语义搜索未配置（缺少 EMBEDDING_API_KEY）',
    });
  }

  try {
    // Embed the user query
    const embRes = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: query.trim(), model: EMBEDDING_MODEL }),
    });

    if (!embRes.ok) {
      console.error('[Search] Embedding API error:', embRes.status);
      return res.status(502).json({ success: false, message: 'Embedding 服务异常，请稍后重试' });
    }

    const embJson = await embRes.json();
    const queryEmbedding = embJson.data[0].embedding;

    // Try TiDB vector search first, fall back to JSON
    let data;
    try {
      data = await searchViaTiDB(queryEmbedding, topK);
      if (data.length > 0) {
        return res.status(200).json({ success: true, data });
      }
    } catch (dbErr) {
      console.warn('[Search] TiDB search failed, falling back to JSON:', dbErr.message);
    }

    // Fallback: JSON-based search
    const embeddings = loadEmbeddings();
    if (!embeddings || embeddings.size === 0) {
      return res.status(503).json({
        success: false,
        message: '文章嵌入数据不可用',
      });
    }

    data = searchViaJSON(queryEmbedding, topK);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Search] 语义搜索失败:', error.message);
    return res.status(500).json({ success: false, message: '语义搜索失败: ' + error.message });
  }
});

module.exports = router;
