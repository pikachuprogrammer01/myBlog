import { ref, computed } from 'vue'
import { useArticleStore } from '@/stores/article.js'

export default function useHome () {
  const articleStore = useArticleStore()

  // 布局状态：grid 或 list
  const layout = ref('grid')
  // 分页状态
  const currentPage = ref(1)
  const pageSize = ref(6)

  // 获取所有文章
  const allArticles = computed(() => articleStore.getAllArticles() || [])

  // 处理分页后的文章列表
  const displayedArticles = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return allArticles.value.slice(start, end)
  })

  const total = computed(() => allArticles.value.length)

  // 轮播图推荐文章（取前3篇有封面的）
  const featuredArticles = computed(() => {
    return allArticles.value.filter(a => a.cover).slice(0, 3)
  })

  return {
    layout,
    currentPage,
    pageSize,
    total,
    articles: displayedArticles,
    featuredArticles
  }
}
