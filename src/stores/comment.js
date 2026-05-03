import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getComments, addComment as addCommentApi, updateComment as updateCommentApi, deleteComment as deleteCommentApi, batchDeleteComments as batchDeleteApi, permanentDeleteComment as permanentDeleteApi, toggleSticky, likeComment as likeCommentApi } from '@/api/services/commentService';
import { getStats } from '@/api/services/articleService';

// Normalize API snake_case to component camelCase
function normalizeComment(c) {
  return {
    id: c.id,
    articleId: c.article_id,
    parentId: c.parent_id || null,
    userId: c.user_id,
    username: c.username,
    userRole: c.user_role,
    content: c.content,
    options: {
      notify: true,
      sticky: !!c.is_sticky,
    },
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    isDeleted: !!c.is_deleted,
    likes: c.likes || 0,
    liked: false, // Will be set if user is authenticated
    likedBy: [],
    avatarUrl: c.avatar_url || null,
  };
}

export const useCommentStore = defineStore('comment', () => {
  const articleComments = ref({}); // keyed by articleSlug
  const loading = ref(false);

  // 获取文章评论
  async function loadComments(articleSlug) {
    loading.value = true;
    try {
      const res = await getComments(articleSlug);
      if (res.data.success) {
        articleComments.value[articleSlug] = (res.data.data || []).map(normalizeComment);
      }
      return articleComments.value[articleSlug] || [];
    } catch {
      return articleComments.value[articleSlug] || [];
    } finally {
      loading.value = false;
    }
  }

  function getCachedComments(articleSlug) {
    return articleComments.value[articleSlug] || [];
  }

  // 生成嵌套评论树
  function getCommentTree(articleSlug) {
    const all = getCachedComments(articleSlug);
    const map = {};
    const roots = [];

    all.forEach((c) => {
      map[c.id] = { ...c, replies: [] };
    });

    all.forEach((c) => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });

    return roots;
  }

  // 添加评论
  async function addComment(articleSlug, content, parentId = null) {
    const res = await addCommentApi(articleSlug, { content, parentId });
    if (res.data.success) {
      const cached = articleComments.value[articleSlug] || [];
      const normalized = normalizeComment(res.data.data);
      articleComments.value[articleSlug] = [normalized, ...cached];
      return { success: true, comment: normalized };
    }
    return { success: false, message: res.data.message };
  }

  // 更新评论
  async function updateComment(commentId, content) {
    const res = await updateCommentApi(commentId, content);
    if (res.data.success) {
      // Update in all cached article comment lists
      Object.keys(articleComments.value).forEach((slug) => {
        const list = articleComments.value[slug];
        const idx = list.findIndex((c) => c.id === commentId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], content };
        }
      });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  }

  // 软删除评论
  async function deleteComment(commentId) {
    const res = await deleteCommentApi(commentId);
    if (res.data.success) {
      Object.keys(articleComments.value).forEach((slug) => {
        articleComments.value[slug] = articleComments.value[slug].filter(
          (c) => c.id !== commentId
        );
      });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  }

  // 批量软删除评论（管理员）
  async function batchDeleteComments(ids) {
    const res = await batchDeleteApi(ids);
    if (res.data.success) {
      Object.keys(articleComments.value).forEach((slug) => {
        articleComments.value[slug] = articleComments.value[slug].filter(
          (c) => !ids.includes(c.id)
        );
      });
      return { success: true, deletedCount: res.data.data?.deletedCount };
    }
    return { success: false, message: res.data.message };
  }

  // 永久删除评论（管理员）
  async function permanentDeleteComment(commentId) {
    const res = await permanentDeleteApi(commentId);
    if (res.data.success) {
      Object.keys(articleComments.value).forEach((slug) => {
        articleComments.value[slug] = articleComments.value[slug].filter(
          (c) => c.id !== commentId
        );
      });
      return { success: true };
    }
    return { success: false, message: res.data.message };
  }

  // 切换置顶
  async function toggleSticky(commentId) {
    const res = await toggleSticky(commentId);
    if (res.data.success) {
      Object.keys(articleComments.value).forEach((slug) => {
        const list = articleComments.value[slug];
        const idx = list.findIndex((c) => c.id === commentId);
        if (idx !== -1) {
          list[idx] = { ...list[idx], options: { ...list[idx].options, sticky: res.data.data.sticky } };
        }
      });
      return { success: true, sticky: res.data.data.sticky };
    }
    return { success: false, message: res.data.message };
  }

  // 点赞评论
  async function likeComment(commentId) {
    const res = await likeCommentApi(commentId);
    if (res.data.success) {
      Object.keys(articleComments.value).forEach((slug) => {
        const list = articleComments.value[slug];
        const idx = list.findIndex((c) => c.id === commentId);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            likes: res.data.data.likes,
            liked: res.data.data.liked,
          };
        }
      });
      return { success: true, likes: res.data.data.likes, liked: res.data.data.liked };
    }
    return { success: false, message: res.data.message };
  }

  const totalCommentCount = computed(() => {
    return Object.values(articleComments.value).reduce((sum, arr) => sum + arr.length, 0);
  });

  const totalCount = ref(0);

  async function loadTotalCount() {
    try {
      const res = await getStats();
      if (res.data.success) {
        totalCount.value = res.data.data.totalComments;
      }
    } catch {
      // Silently fail — footer will show 0
    }
  }

  return {
    articleComments,
    loading,
    totalCommentCount,
    totalCount,
    loadTotalCount,
    loadComments,
    getCachedComments,
    getCommentTree,
    addComment,
    updateComment,
    deleteComment,
    batchDeleteComments,
    permanentDeleteComment,
    toggleSticky,
    likeComment,
  };
});
