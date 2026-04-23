import { useArticleStore } from '@/stores/article'

export function useArticles() {
  const articleStore = useArticleStore()

  // 获取所有文章
  const getArticles = () => {
    return articleStore.getAllArticles()
  }

  // 根据ID获取文章
  const getArticle = (id) => {
    return articleStore.getArticleById(id)
  }

  // 根据标签获取文章
  const getArticlesByTag = (tag) => {
    return articleStore.getArticlesByTag(tag)
  }

  const getArticlesByCategory = (category) => {
    return articleStore.getArticlesByCategory(category)
  }

  // 搜索文章
  const searchArticles = (keyword) => {
    return articleStore.searchArticles(keyword)
  }

  // 获取热门标签
  const getPopularTags = () => {
    return articleStore.getPopularTags
  }

  // 获取归档数据
  const getArchive = () => {
    return articleStore.getArticlesByArchive
  }

  const getCategories = () => {
    return articleStore.getCategories
  }

  // 增加阅读量（模拟）
  const incrementViewCount = (articleId) => {
    return articleStore.incrementViews(articleId)
  }

  // 获取阅读量
  const getViewCount = (articleId) => {
    return articleStore.getViewCount(articleId)
  }

  const getTotalViews = () => {
    return articleStore.getTotalViews()
  }

  const getArticleLikeCount = (articleId) => {
    return articleStore.getArticleLikeCount(articleId)
  }

  const setArticleLikeCount = (articleId, likes) => {
    return articleStore.setArticleLikeCount(articleId, likes)
  }

  return {
    getArticles,
    getArticle,
    getArticlesByTag,
    getArticlesByCategory,
    searchArticles,
    getPopularTags,
    getArchive,
    getCategories,
    incrementViewCount,
    getViewCount,
    getTotalViews,
    getArticleLikeCount,
    setArticleLikeCount
  }
}
