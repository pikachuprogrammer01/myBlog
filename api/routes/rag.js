const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY;
const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL || 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const RAG_MODEL = process.env.RAG_MODEL || 'Qwen/Qwen3-8B';
const RAG_CHAT_URL = EMBEDDING_API_URL.replace(/\/embeddings$/, '/chat/completions');

// Module-level caches
let cachedEmbeddings = null;
let cachedArticlesWithContent = null;

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

function loadArticlesWithContent() {
  if (cachedArticlesWithContent) return cachedArticlesWithContent;
  try {
    const filePath = path.join(__dirname, '..', '..', 'src', 'data', 'articles.json');
    if (!fs.existsSync(filePath)) return [];
    cachedArticlesWithContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return cachedArticlesWithContent;
  } catch {
    return [];
  }
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

async function searchTiDB(queryEmbedding, topK) {
  const vecStr = JSON.stringify(queryEmbedding);
  const limit = Number(topK) || 3;
  const [rows] = await pool.execute(
    `SELECT slug, title, content, summary, created_at, tags,
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
    content: r.content || '',
    excerpt: r.summary || '',
    score: Math.round((1 - r.distance) * 10000) / 10000,
  }));
}

function searchJSON(queryEmbedding, topK) {
  const embeddings = loadEmbeddings();
  const articles = loadArticlesWithContent();
  const ranked = [];

  for (const article of articles) {
    if (article.published === false) continue;
    const emb = embeddings.get(article.id);
    if (!emb) continue;
    ranked.push({
      id: article.id,
      title: article.title,
      content: article.content || '',
      excerpt: article.excerpt || '',
      score: Math.round(cosineSimilarity(queryEmbedding, emb) * 10000) / 10000,
    });
  }

  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, topK);
}

// POST /api/rag/ask
router.post('/ask', async (req, res) => {
  const { question } = req.body || {};

  if (!question || !question.trim()) {
    return res.status(400).json({ success: false, message: '请输入问题' });
  }

  if (!EMBEDDING_API_KEY) {
    return res.status(503).json({
      success: false,
      message: 'RAG 问答未配置（缺少 EMBEDDING_API_KEY）',
    });
  }

  try {
    // 1. Embed the question
    const embRes = await fetch(EMBEDDING_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: question.trim(), model: EMBEDDING_MODEL }),
    });

    if (!embRes.ok) {
      return res.status(502).json({ success: false, message: 'Embedding 服务异常' });
    }

    const embJson = await embRes.json();
    const queryEmbedding = embJson.data[0].embedding;

    // 2. Search top 3 articles (TiDB → JSON fallback)
    let sources;
    try {
      sources = await searchTiDB(queryEmbedding, 3);
    } catch (dbErr) {
      console.warn('[RAG] TiDB search failed, falling back to JSON:', dbErr.message);
    }

    if (!sources || sources.length === 0) {
      const embeddings = loadEmbeddings();
      if (!embeddings || embeddings.size === 0) {
        return res.status(503).json({
          success: false,
          message: '文章嵌入数据不可用，请先运行 npm run build:content',
        });
      }
      sources = searchJSON(queryEmbedding, 3);
    }

    // 3. Build RAG prompt
    const contextParts = sources.map((s, i) =>
      `文章${i + 1}：\n标题：${s.title}\n内容：${s.content.substring(0, 3000)}`
    );
    const context = contextParts.join('\n\n---\n\n');

    const systemPrompt = '你是一个技术博客的知识助手。请仅根据以下文章内容回答用户的问题。如果文章中没有相关信息，请如实告知。回答时请引用具体的文章标题。';
    const userMessage = `相关文章：\n\n${context}\n\n用户问题：${question.trim()}\n请用中文回答，并在回答末尾注明引用自哪些文章（格式：参考来源：文章1标题, 文章2标题）。`;

    // 4. Call LLM
    const chatRes = await fetch(RAG_CHAT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: RAG_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.5,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      console.error('[RAG] Chat API error:', chatRes.status, errText);
      return res.status(502).json({ success: false, message: 'LLM 服务异常，请稍后重试' });
    }

    const chatJson = await chatRes.json();
    const answer = chatJson.choices[0].message.content;

    return res.status(200).json({
      success: true,
      data: {
        answer,
        sources: sources.map((s) => ({
          id: s.id,
          title: s.title,
          score: s.score,
        })),
      },
    });
  } catch (error) {
    console.error('[RAG] 问答失败:', error.message);
    return res.status(500).json({ success: false, message: '问答失败: ' + error.message });
  }
});

module.exports = router;
