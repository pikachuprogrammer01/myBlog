import { useCommentStore } from '@/stores/comment';

export function useComments() {
  const commentStore = useCommentStore();

  function getComments(articleSlug) {
    return commentStore.getCachedComments(articleSlug);
  }

  function getCommentTree(articleSlug) {
    return commentStore.getCommentTree(articleSlug);
  }

  function loadComments(articleSlug) {
    return commentStore.loadComments(articleSlug);
  }

  function addComment(articleSlug, content, parentId = null) {
    return commentStore.addComment(articleSlug, content, parentId);
  }

  function updateComment(commentId, content) {
    return commentStore.updateComment(commentId, content);
  }

  function deleteComment(commentId) {
    return commentStore.deleteComment(commentId);
  }

  function permanentDeleteComment(commentId) {
    return commentStore.permanentDeleteComment(commentId);
  }

  function toggleSticky(commentId) {
    return commentStore.toggleSticky(commentId);
  }

  function likeComment(commentId) {
    return commentStore.likeComment(commentId);
  }

  function getCommentsCount(articleSlug) {
    return commentStore.getCachedComments(articleSlug).length;
  }

  function getTotalCommentCount() {
    return commentStore.totalCount;
  }

  function loadTotalCommentCount() {
    return commentStore.loadTotalCount();
  }

  return {
    getComments,
    getCommentTree,
    loadComments,
    addComment,
    updateComment,
    deleteComment,
    permanentDeleteComment,
    toggleSticky,
    likeComment,
    getCommentsCount,
    getTotalCommentCount,
    loadTotalCommentCount,
  };
}
