import { useArticleStore } from '@/stores/article';

export function useArticles() {
  const articleStore = useArticleStore();

  function loadArticles() {
    return articleStore.loadArticles();
  }

  function loadCategories() {
    return articleStore.loadCategories();
  }

  function getArticles() {
    return articleStore.getAllArticles();
  }

  function getArticle(id) {
    return articleStore.getArticleById(id);
  }

  function searchArticles(keyword) {
    return articleStore.searchArticles(keyword);
  }

  function getPopularTags() {
    return articleStore.getPopularTags;
  }

  function getArchive() {
    return articleStore.getArticlesByArchive;
  }

  function getCategories() {
    return articleStore.categories.length > 0
      ? articleStore.categories
      : articleStore.getPopularTags; // fallback to tag-derived categories
  }

  function toggleLike(slug) {
    return articleStore.toggleLike(slug);
  }

  function getLikeStatus(slug) {
    return articleStore.getLikeStatus(slug);
  }

  function toggleBookmark(slug) {
    return articleStore.toggleBookmark(slug);
  }

  function getBookmarkStatus(slug) {
    return articleStore.getBookmarkStatus(slug);
  }

  function getBookmarks() {
    return articleStore.getBookmarks();
  }

  function getArticlesByTag(tag) {
    return articleStore.getArticlesByTag(tag);
  }

  function getArticlesByCategory(categoryId) {
    return articleStore.getArticlesByCategory(categoryId);
  }

  function getTotalViews() {
    return articleStore.getTotalViews();
  }

  return {
    loadArticles,
    loadCategories,
    getArticles,
    getArticle,
    searchArticles,
    getPopularTags,
    getArchive,
    getCategories,
    toggleLike,
    getLikeStatus,
    toggleBookmark,
    getBookmarkStatus,
    getBookmarks,
    getArticlesByTag,
    getArticlesByCategory,
    getTotalViews,
  };
}
