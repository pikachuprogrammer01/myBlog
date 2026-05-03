import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getArticles, getCategories, toggleLike, getLikeStatus, toggleBookmark, getBookmarkStatus, getBookmarks } from '@/api/services/articleService';
import articlesData from '@/data/articles.json';
import { getCache, setCache, removeCache } from '@/utils/cache';
import { STORAGE_KEYS } from '@/constants/storage-keys';

export const useArticleStore = defineStore('article', () => {
  const articles = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const lastFetched = ref(0);
  const lastCategoriesFetched = ref(0);
  const fetchPromise = ref(null);
  const CACHE_TTL = 5 * 60 * 1000;

  function mapArticle(a) {
    return {
      ...a,
      id: a.slug || a.id,
      date: a.created_at,
      excerpt: a.summary,
      cover: a.cover_image,
      categories: a.category_name ? [a.category_name] : [],
    };
  }

  // Load articles: cache-first → static JSON → API refresh in background
  async function loadArticles(force = false) {
    // Deduplication: reuse in-flight request
    if (fetchPromise.value) return fetchPromise.value;

    // Freshness check
    if (!force && articles.value.length > 0 && Date.now() - lastFetched.value < CACHE_TTL) {
      return;
    }

    // Step 1: localStorage cache → immediate render
    const cached = getCache(STORAGE_KEYS.CACHED_ARTICLES);
    if (cached && cached.length > 0) {
      articles.value = cached;
      loading.value = false;
    }

    // Step 2: static JSON baseline if still empty
    if (articles.value.length === 0) {
      loading.value = true;
      articles.value = articlesData.map((a) => ({
        ...a,
        views: 0,
        likes: 0,
        categories: Array.isArray(a.categories) ? a.categories : a.category ? [a.category] : ['未分类'],
      }));
      loading.value = false;
    }

    // Step 3: API refresh in background (stale-while-revalidate)
    const promise = (async () => {
      try {
        const res = await getArticles({ limit: 100 });
        if (res.data.success) {
          articles.value = res.data.data.map(mapArticle);
          setCache(STORAGE_KEYS.CACHED_ARTICLES, articles.value);
          lastFetched.value = Date.now();
        }
      } catch {
        // Keep whatever is already displayed
      } finally {
        fetchPromise.value = null;
      }
    })();

    fetchPromise.value = promise;
    return promise;
  }

  // Load categories with cache-first pattern
  async function loadCategories(force = false) {
    if (!force && categories.value.length > 0 && Date.now() - lastCategoriesFetched.value < CACHE_TTL) {
      return;
    }

    const cached = getCache(STORAGE_KEYS.CACHED_CATEGORIES);
    if (cached && cached.length > 0) {
      categories.value = cached;
    }

    try {
      const res = await getCategories();
      if (res.data.success) {
        categories.value = res.data.data.map((c) => ({
          id: c.slug,
          name: c.name,
          count: c.article_count,
          slug: c.slug,
        }));
        setCache(STORAGE_KEYS.CACHED_CATEGORIES, categories.value);
        lastCategoriesFetched.value = Date.now();
      }
    } catch {
      // Keep cached data
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

  function getTotalViews() {
    return getAllArticles().reduce((sum, a) => sum + (a.view_count || a.views || 0), 0);
  }

  function getArticlesByTag(tag) {
    return getAllArticles().filter((a) => {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      return tags.some((t) => String(t).toLowerCase() === String(tag).toLowerCase());
    });
  }

  function getArticlesByCategory(categoryId) {
    const target = String(categoryId).toLowerCase();
    return getAllArticles().filter((a) => {
      if (a.category_slug && String(a.category_slug).toLowerCase() === target) return true;
      const cats = Array.isArray(a.categories) ? a.categories : a.category_name ? [a.category_name] : [];
      return cats.some((c) => {
        const name = typeof c === 'object' ? c.name || c.slug : c;
        return String(name).toLowerCase() === target;
      });
    });
  }

  function getPreviousNextArticles(currentId) {
    const sorted = getAllArticles();
    const idx = sorted.findIndex((a) => a.id === currentId || a.slug === currentId);
    return {
      previous: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }

  function invalidateCache() {
    lastFetched.value = 0;
    lastCategoriesFetched.value = 0;
    removeCache(STORAGE_KEYS.CACHED_ARTICLES);
    removeCache(STORAGE_KEYS.CACHED_CATEGORIES);
  }

  // Like — via API
  async function toggleLike(slug) {
    const res = await toggleLike(slug);
    if (res.data.success) {
      const article = articles.value.find((a) => a.slug === slug || a.id === slug);
      if (article) {
        article.likes = res.data.data.likes;
        article.liked = res.data.data.liked;
      }
      return { liked: res.data.data.liked, likes: res.data.data.likes };
    }
    return null;
  }

  async function getLikeStatus(slug) {
    try {
      const res = await getLikeStatus(slug);
      // API now returns { likes, liked } — liked is false if not authenticated
      return res.data.success ? res.data.data : { likes: 0, liked: false };
    } catch {
      return { likes: 0, liked: false };
    }
  }

  // Bookmark — via API
  async function toggleBookmark(slug) {
    const res = await toggleBookmark(slug);
    if (res.data.success) {
      const article = articles.value.find((a) => a.slug === slug || a.id === slug);
      if (article) {
        article.bookmarked = res.data.data.bookmarked;
      }
      return { bookmarked: res.data.data.bookmarked };
    }
    return null;
  }

  async function getBookmarkStatus(slug) {
    try {
      const res = await getBookmarkStatus(slug);
      return res.data.success ? res.data.data : { bookmarks: 0, bookmarked: false };
    } catch {
      return { bookmarks: 0, bookmarked: false };
    }
  }

  async function getBookmarks() {
    try {
      const res = await getBookmarks();
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
    getArticlesByTag,
    getArticlesByCategory,
    getTotalViews,
    invalidateCache,
    toggleLike,
    getLikeStatus,
    toggleBookmark,
    getBookmarkStatus,
    getBookmarks,
  };
});
