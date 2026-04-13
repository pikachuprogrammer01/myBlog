import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/constants/storage-keys'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref([])

  // 加载评论
  const loadComments = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.COMMENTS)
    comments.value = stored ? JSON.parse(stored) : []
  }

  // 保存到localStorage
  const saveComments = () => {
    localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments.value))
  }

  // 生成ID
  const generateId = () => {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 获取文章评论（扁平结构，按时间倒序）
  const getArticleComments = (articleId) => {
    return comments.value.filter(
      comment => comment.articleId === articleId && !comment.isDeleted
    ).sort((a, b) => b.createdAt - a.createdAt)
  }

  // 获取评论的回复
  const getCommentReplies = (commentId) => {
    return comments.value.filter(
      comment => comment.parentId === commentId && !comment.isDeleted
    ).sort((a, b) => a.createdAt - b.createdAt)
  }

  // 获取评论树（嵌套结构）
  const getCommentTree = (articleId) => {
    const allComments = getArticleComments(articleId)
    const commentMap = {}
    const rootComments = []

    // 构建映射
    allComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] }
    })

    // 构建树
    allComments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentMap[comment.parentId]
        if (parent) {
          parent.replies.push(commentMap[comment.id])
        } else {
          // 父评论可能已被删除，作为根评论处理
          rootComments.push(commentMap[comment.id])
        }
      } else {
        rootComments.push(commentMap[comment.id])
      }
    })

    return rootComments
  }

  // 添加评论
  const addComment = (commentData) => {
    const {
      articleId,
      content,
      userId,
      username,
      parentId = null,
      options = {}
    } = commentData

    const newComment = {
      id: generateId(),
      articleId,
      parentId,
      userId,
      username,
      content,
      options: {
        notify: options.notify !== undefined ? options.notify : true,
        sticky: options.sticky || false
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
      likes: 0,
      likedBy: []
    }

    comments.value.push(newComment)
    saveComments()
    return { success: true, comment: newComment }
  }

  // 更新评论
  const updateComment = (commentId, updates) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index === -1) {
      return { success: false, message: '评论不存在' }
    }

    comments.value[index] = {
      ...comments.value[index],
      ...updates,
      updatedAt: Date.now()
    }

    saveComments()
    return { success: true, comment: comments.value[index] }
  }

  // 删除评论（软删除）
  const deleteComment = (commentId) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index !== -1) {
      comments.value[index].isDeleted = true
      comments.value[index].updatedAt = Date.now()
      saveComments()
      return { success: true }
    }
    return { success: false, message: '评论不存在' }
  }

  // 永久删除评论（管理员功能）
  const permanentDeleteComment = (commentId) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index !== -1) {
      comments.value.splice(index, 1)
      saveComments()
      return { success: true }
    }
    return { success: false, message: '评论不存在' }
  }

  // 置顶/取消置顶评论（管理员功能）
  const toggleCommentSticky = (commentId) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index === -1) {
      return { success: false, message: '评论不存在' }
    }

    comments.value[index].options.sticky = !comments.value[index].options.sticky
    comments.value[index].updatedAt = Date.now()
    saveComments()
    return {
      success: true,
      sticky: comments.value[index].options.sticky
    }
  }

  // 点赞评论
  const likeComment = (commentId, userId) => {
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index === -1) {
      return { success: false, message: '评论不存在' }
    }

    const comment = comments.value[index]
    const likedIndex = comment.likedBy.indexOf(userId)

    if (likedIndex === -1) {
      comment.likes += 1
      comment.likedBy.push(userId)
    } else {
      comment.likes -= 1
      comment.likedBy.splice(likedIndex, 1)
    }

    comment.updatedAt = Date.now()
    saveComments()
    return { success: true, likes: comment.likes, liked: likedIndex === -1 }
  }

  // 获取评论统计
  const getCommentStats = computed(() => {
    const total = comments.value.length
    const active = comments.value.filter(c => !c.isDeleted).length
    const deleted = total - active
    const sticky = comments.value.filter(c => c.options.sticky).length

    return { total, active, deleted, sticky }
  })

  // 获取用户评论
  const getUserComments = (userId) => {
    return comments.value.filter(
      comment => comment.userId === userId && !comment.isDeleted
    ).sort((a, b) => b.createdAt - a.createdAt)
  }

  // 清空所有评论（Admin功能）
  const clearAllComments = () => {
    comments.value = []
    saveComments()
    return { success: true }
  }

  // 导出评论数据
  const exportComments = () => {
    return JSON.stringify(comments.value, null, 2)
  }

  // 导入评论数据
  const importComments = (data) => {
    try {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        comments.value = parsed
        saveComments()
        return { success: true, count: parsed.length }
      }
      return { success: false, message: '数据格式错误' }
    } catch (error) {
      return { success: false, message: '解析数据失败' }
    }
  }

  // 初始化加载
  loadComments()

  return {
    comments,
    loadComments,
    getArticleComments,
    getCommentReplies,
    getCommentTree,
    addComment,
    updateComment,
    deleteComment,
    permanentDeleteComment,
    toggleCommentSticky,
    likeComment,
    getUserComments,
    clearAllComments,
    exportComments,
    importComments,
    getCommentStats
  }
})