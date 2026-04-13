import { useCommentStore } from '@/stores/comment'
import { useAuth } from './useAuth'

export function useComments() {
  const commentStore = useCommentStore()
  const { getCurrentUser, checkAdmin } = useAuth()

  // 获取文章评论（扁平列表）
  const getComments = (articleId) => {
    return commentStore.getArticleComments(articleId)
  }

  // 获取文章评论树（嵌套结构）
  const getCommentTree = (articleId) => {
    return commentStore.getCommentTree(articleId)
  }

  // 获取评论的回复
  const getCommentReplies = (commentId) => {
    return commentStore.getCommentReplies(commentId)
  }

  // 添加评论
  const addComment = (commentData) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return { success: false, message: '需要登录后才能发表评论' }
    }

    const fullCommentData = {
      ...commentData,
      userId: currentUser.id,
      username: currentUser.username
    }

    return commentStore.addComment(fullCommentData)
  }

  // 更新评论
  const updateComment = (commentId, updates) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return { success: false, message: '需要登录后才能编辑评论' }
    }

    const comment = commentStore.comments.find(c => c.id === commentId)
    if (!comment) {
      return { success: false, message: '评论不存在' }
    }

    // 检查权限：只有评论作者或管理员可以编辑
    if (comment.userId !== currentUser.id && !checkAdmin()) {
      return { success: false, message: '没有权限编辑此评论' }
    }

    return commentStore.updateComment(commentId, updates)
  }

  // 删除评论（软删除）
  const deleteComment = (commentId) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return { success: false, message: '需要登录后才能删除评论' }
    }

    const comment = commentStore.comments.find(c => c.id === commentId)
    if (!comment) {
      return { success: false, message: '评论不存在' }
    }

    // 检查权限：只有评论作者或管理员可以删除
    if (comment.userId !== currentUser.id && !checkAdmin()) {
      return { success: false, message: '没有权限删除此评论' }
    }

    return commentStore.deleteComment(commentId)
  }

  // 永久删除评论（仅管理员）
  const permanentDeleteComment = (commentId) => {
    if (!checkAdmin()) {
      return { success: false, message: '需要管理员权限' }
    }

    return commentStore.permanentDeleteComment(commentId)
  }

  // 置顶/取消置顶评论（仅管理员）
  const toggleCommentSticky = (commentId) => {
    if (!checkAdmin()) {
      return { success: false, message: '需要管理员权限' }
    }

    return commentStore.toggleCommentSticky(commentId)
  }

  // 点赞评论
  const likeComment = (commentId) => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      return { success: false, message: '需要登录后才能点赞' }
    }

    return commentStore.likeComment(commentId, currentUser.id)
  }

  // 获取用户评论
  const getUserComments = (userId) => {
    return commentStore.getUserComments(userId)
  }

  // 获取当前用户的评论
  const getMyComments = () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return []
    return commentStore.getUserComments(currentUser.id)
  }

  // 获取评论统计
  const getStats = () => {
    return commentStore.getCommentStats
  }

  // 获取文章评论数量
  const getCommentsCount = (articleId) => {
    const comments = commentStore.getArticleComments(articleId)
    return comments.length
  }

  // 清空所有评论（管理员功能）
  const clearAllComments = () => {
    if (!checkAdmin()) {
      return { success: false, message: '需要管理员权限' }
    }
    return commentStore.clearAllComments()
  }

  // 导出评论数据
  const exportComments = () => {
    if (!checkAdmin()) {
      return { success: false, message: '需要管理员权限' }
    }
    return commentStore.exportComments()
  }

  // 导入评论数据
  const importComments = (data) => {
    if (!checkAdmin()) {
      return { success: false, message: '需要管理员权限' }
    }
    return commentStore.importComments(data)
  }

  return {
    // 查询
    getComments,
    getCommentTree,
    getCommentReplies,
    getUserComments,
    getMyComments,
    getStats,
    getCommentsCount,

    // 操作
    addComment,
    updateComment,
    deleteComment,
    permanentDeleteComment,
    toggleCommentSticky,
    likeComment,

    // 管理功能
    clearAllComments,
    exportComments,
    importComments
  }
}