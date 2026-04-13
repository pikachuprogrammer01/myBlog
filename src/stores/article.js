import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import articlesData from '@/data/articles.json'

export const useArticleStore = defineStore('article', () => {
  const articles = ref(articlesData)

  // 获取所有文章（按日期倒序）
  const getAllArticles = () => {
    return [...articles.value].sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })
  }

  // 根据ID获取文章
  const getArticleById = (id) => {
    return articles.value.find(article => article.id === id)
  }

  // 根据标签获取文章
  const getArticlesByTag = (tag) => {
    return articles.value.filter(article =>
      article.tags && article.tags.includes(tag)
    )
  }

  // 搜索文章
  const searchArticles = (keyword) => {
    if (!keyword.trim()) return []

    const lowerKeyword = keyword.toLowerCase()
    return articles.value.filter(article =>
      article.title.toLowerCase().includes(lowerKeyword) ||
      article.excerpt.toLowerCase().includes(lowerKeyword) ||
      article.content.toLowerCase().includes(lowerKeyword)
    )
  }

  // 获取热门标签
  const getPopularTags = computed(() => {
    const tagCount = {}
    articles.value.forEach(article => {
      if (article.tags) {
        article.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))
  })

  // 按年月归档
  const getArticlesByArchive = computed(() => {
    const archiveMap = {}

    articles.value.forEach(article => {
      if (article.date) {
        const date = new Date(article.date)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${month.toString().padStart(2, '0')}`

        if (!archiveMap[key]) {
          archiveMap[key] = {
            year,
            month,
            key,
            display: `${year}年${month}月`,
            articles: []
          }
        }

        archiveMap[key].articles.push(article)
      }
    })

    return Object.values(archiveMap)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
  })

  // 获取上一篇和下一篇文章
  const getPreviousNextArticles = (currentArticleId) => {
    const sortedArticles = getAllArticles()
    const currentIndex = sortedArticles.findIndex(article => article.id === currentArticleId)

    if (currentIndex === -1) {
      return { previous: null, next: null }
    }

    const previous = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null
    const next = currentIndex < sortedArticles.length - 1 ? sortedArticles[currentIndex + 1] : null

    return { previous, next }
  }

  // 增加文章阅读量
  const incrementViews = (articleId) => {
    const article = articles.value.find(article => article.id === articleId)
    if (article) {
      if (!article.views) {
        article.views = 0
      }
      article.views++
      // 这里可以添加localStorage持久化逻辑
      // 简化处理，直接更新内存中的值
    }
  }

  return {
    articles,
    getAllArticles,
    getArticleById,
    getArticlesByTag,
    searchArticles,
    getPopularTags,
    getArticlesByArchive,
    getPreviousNextArticles,
    incrementViews
  }
})