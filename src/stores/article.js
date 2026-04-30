import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import client from '@/api/client';
import articlesData from '@/data/articles.json';

export const useArticleStore = defineStore('article', () => {
  const articles = ref([]);
  const categories = ref([]);
  const loading = ref(false);

  // Load articles from API, fallback to static JSON
  async function loadArticles() {
    loading.value = true;
    try {
      const res = await client.get('/api/articles', { params: { limit: 100 } });
      if (res.data.success) {
        articles.value = res.data.data.map((a) => ({
          ...a,
          id: a.slug || a.id, // Use slug as id for compatibility
          date: a.created_at,
          excerpt: a.summary,
          cover: a.cover_image,
          categories: a.category_name ? [a.category_name] : [],
        }));
        return;
      }
    } catch {
      // Fallback to static data
    } finally {
      loading.value = false;
    }
    // Static fallback
    articles.value = articlesData.map((a) => ({
      ...a,
      views: 0,
      likes: 0,
      categories: Array.isArray(a.categories) ? a.categories : a.category ? [a.category] : ['未分类'],
    }));
  }

  // Load categories from API
  async function loadCategories() {
    try {
      const res = await client.get('/api/categories');
      if (res.data.success) {
        categories.value = res.data.data.map((c) => ({
          id: c.slug,
          name: c.name,
          count: c.article_count,
          slug: c.slug,
        }));
        return;
      }
    } catch {
      // Fallback: derive from articles
    }
  }

  function getAllArticles() {
    return articles.value.filter((a) => a.status !== 'draft').sort((a, b) => {
      return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
    });
  }

  function getArticleById(id) {
    return articles.value.find((a) => a.id === id || a.slug === id) || null;
  }

  function searchArticles(keyword) {
    if (!keyword.trim()) return [];
    const kw = keyword.toLowerCase();
    return getAllArticles().filter((a) => {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      const cats = Array.isArray(a.categories) ? a.categories : [];
      try {
        return (
          (a.title || '').toLowerCase().includes(kw) ||
          (a.excerpt || a.summary || '').toLowerCase().includes(kw) ||
          (a.content || '').toLowerCase().includes(kw) ||
          tags.some((t) => String(t).toLowerCase().includes(kw)) ||
          cats.some((c) => String(c).toLowerCase().includes(kw))
        );
      } catch {
        return (
          (a.title || '').toLowerCase().includes(kw) ||
          (a.excerpt || a.summary || '').toLowerCase().includes(kw)
        );
      }
    });
  }

  const getPopularTags = computed(() => {
    const tagCount = {};
    getAllArticles().forEach((a) => {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      tags.forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  });

  const getArticlesByArchive = computed(() => {
    const map = {};
    getAllArticles().forEach((a) => {
      const d = new Date(a.date || a.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) {
        map[key] = { year: d.getFullYear(), month: d.getMonth() + 1, key, articles: [] };
      }
      map[key].articles.push(a);
    });
    return Object.values(map).sort((a, b) => b.year - a.year || b.month - a.month);
  });

  function getPreviousNextArticles(currentId) {
    const sorted = getAllArticles();
    const idx = sorted.findIndex((a) => a.id === currentId || a.slug === currentId);
    return {
      previous: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }

  // Like — via API
  async function toggleLike(slug) {
    const res = await client.post(`/api/articles/${slug}/like`);
    if (res.data.success) {
      return { liked: res.data.data.liked, likes: res.data.data.likes };
    }
    return null;
  }

  async function getLikeCount(slug) {
    try {
      const res = await client.get(`/api/articles/${slug}/like`);
      return res.data.success ? res.data.data.likes : 0;
    } catch {
      return 0;
    }
  }

  // Bookmark — via API
  async function toggleBookmark(slug) {
    const res = await client.post(`/api/articles/${slug}/bookmark`);
    if (res.data.success) {
      return { bookmarked: res.data.data.bookmarked };
    }
    return null;
  }

  async function getBookmarks() {
    try {
      const res = await client.get('/api/user/bookmarks');
      return res.data.success ? res.data.data : [];
    } catch {
      return [];
    }
  }

  return {
    articles,
    categories,
    loading,
    loadArticles,
    loadCategories,
    getAllArticles,
    getArticleById,
    searchArticles,
    getPopularTags,
    getArticlesByArchive,
    getPreviousNextArticles,
    toggleLike,
    getLikeCount,
    toggleBookmark,
    getBookmarks,
  };
});
