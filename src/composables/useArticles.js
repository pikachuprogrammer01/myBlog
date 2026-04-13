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

  // 增加阅读量（模拟）
  const incrementViewCount = (articleId) => {
    // 这里可以实现在localStorage中记录阅读量
    const viewKey = `article_views_${articleId}`
    const views = parseInt(localStorage.getItem(viewKey) || '0') + 1
    localStorage.setItem(viewKey, views.toString())
    return views
  }

  // 获取阅读量
  const getViewCount = (articleId) => {
    const viewKey = `article_views_${articleId}`
    return parseInt(localStorage.getItem(viewKey) || '0')
  }

  return {
    getArticles,
    getArticle,
    getArticlesByTag,
    searchArticles,
    getPopularTags,
    getArchive,
    incrementViewCount,
    getViewCount
  }
}