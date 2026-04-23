import { defineStore } from "pinia";
import { ref, computed } from "vue";
import articlesData from "@/data/articles.json";
import { STORAGE_KEYS } from "@/constants/storage-keys";

const readStoredMap = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return {};
  }
};

const writeStoredMap = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const resolveCategories = (article) => {
  if (Array.isArray(article.categories) && article.categories.length > 0) {
    return article.categories;
  }

  if (article.category) {
    return [article.category];
  }

  return ["未分类"];
};

export const useArticleStore = defineStore("article", () => {
  const articles = ref(articlesData);

  const decorateArticle = (article) => {
    const viewMap = readStoredMap(STORAGE_KEYS.ARTICLE_VIEWS);
    const likeMap = readStoredMap(STORAGE_KEYS.ARTICLE_LIKES);

    return {
      ...article,
      categories: resolveCategories(article),
      views: Number(viewMap[article.id] ?? article.views ?? 0),
      likes: Number(likeMap[article.id] ?? article.likes ?? 0),
    };
  };

  // 获取所有文章（按日期倒序）
  const getAllArticles = () => {
    return articles.value
      .filter((article) => article.published !== false)
      .map(decorateArticle)
      .sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
  };

  // 根据ID获取文章
  const getArticleById = (id) => {
    const targetArticle = articles.value.find((article) => article.id === id);
    return targetArticle ? decorateArticle(targetArticle) : null;
  };

  // 根据标签获取文章
  const getArticlesByTag = (tag) => {
    return getAllArticles().filter(
      (article) => article.tags && article.tags.includes(tag),
    );
  };

  const getArticlesByCategory = (category) => {
    return getAllArticles().filter((article) => {
      return resolveCategories(article).includes(category);
    });
  };

  // 搜索文章
  const searchArticles = (keyword) => {
    if (!keyword.trim()) return [];

    const lowerKeyword = keyword.toLowerCase();
    return getAllArticles().filter(
      (article) =>
        article.title.toLowerCase().includes(lowerKeyword) ||
        article.excerpt.toLowerCase().includes(lowerKeyword) ||
        article.content.toLowerCase().includes(lowerKeyword) ||
        article.tags?.some((tag) => tag.toLowerCase().includes(lowerKeyword)) ||
        resolveCategories(article).some((category) =>
          category.toLowerCase().includes(lowerKeyword),
        ),
    );
  };

  // 获取热门标签
  const getPopularTags = computed(() => {
    const tagCount = {};
    getAllArticles().forEach((article) => {
      if (article.tags) {
        article.tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  });

  // 按年月归档
  const getArticlesByArchive = computed(() => {
    const archiveMap = {};

    getAllArticles().forEach((article) => {
      if (article.date) {
        const date = new Date(article.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month.toString().padStart(2, "0")}`;

        if (!archiveMap[key]) {
          archiveMap[key] = {
            year,
            month,
            key,
            display: `${year}年${month}月`,
            articles: [],
          };
        }

        archiveMap[key].articles.push(article);
      }
    });

    return Object.values(archiveMap).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  });

  // 获取上一篇和下一篇文章
  const getPreviousNextArticles = (currentArticleId) => {
    const sortedArticles = getAllArticles();
    const currentIndex = sortedArticles.findIndex(
      (article) => article.id === currentArticleId,
    );

    if (currentIndex === -1) {
      return { previous: null, next: null };
    }

    const previous = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null;
    const next =
      currentIndex < sortedArticles.length - 1
        ? sortedArticles[currentIndex + 1]
        : null;

    return { previous, next };
  };

  // 增加文章阅读量
  const incrementViews = (articleId) => {
    const viewMap = readStoredMap(STORAGE_KEYS.ARTICLE_VIEWS);
    viewMap[articleId] =
      Number(viewMap[articleId] ?? getArticleById(articleId)?.views ?? 0) + 1;
    writeStoredMap(STORAGE_KEYS.ARTICLE_VIEWS, viewMap);
    return viewMap[articleId];
  };

  const getViewCount = (articleId) => {
    return Number(
      readStoredMap(STORAGE_KEYS.ARTICLE_VIEWS)[articleId] ??
        getArticleById(articleId)?.views ??
        0,
    );
  };

  const getTotalViews = () => {
    return Object.values(readStoredMap(STORAGE_KEYS.ARTICLE_VIEWS)).reduce(
      (total, count) => total + Number(count || 0),
      0,
    );
  };

  const getArticleLikeCount = (articleId) => {
    return Number(
      readStoredMap(STORAGE_KEYS.ARTICLE_LIKES)[articleId] ??
        getArticleById(articleId)?.likes ??
        0,
    );
  };

  const setArticleLikeCount = (articleId, likes) => {
    const likeMap = readStoredMap(STORAGE_KEYS.ARTICLE_LIKES);
    likeMap[articleId] = Math.max(0, Number(likes) || 0);
    writeStoredMap(STORAGE_KEYS.ARTICLE_LIKES, likeMap);
    return likeMap[articleId];
  };

  const getCategories = computed(() => {
    const categoryCount = {};

    getAllArticles().forEach((article) => {
      resolveCategories(article).forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    return Object.entries(categoryCount)
      .map(([name, count]) => ({ id: name, name, count }))
      .sort(
        (leftCategory, rightCategory) =>
          rightCategory.count - leftCategory.count,
      );
  });

  return {
    articles,
    getAllArticles,
    getArticleById,
    getArticlesByTag,
    getArticlesByCategory,
    searchArticles,
    getPopularTags,
    getArticlesByArchive,
    getPreviousNextArticles,
    incrementViews,
    getViewCount,
    getTotalViews,
    getArticleLikeCount,
    setArticleLikeCount,
    getCategories,
  };
});
