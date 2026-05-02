import client from '@/api/client';

export function getComments(articleSlug) {
  return client.get(`/api/articles/${articleSlug}/comments`);
}

export function addComment(articleSlug, { content, parentId }) {
  return client.post(`/api/articles/${articleSlug}/comments`, {
    content,
    parentId: parentId || undefined,
  });
}

export function updateComment(commentId, content) {
  return client.put(`/api/comments/${commentId}`, { content });
}

export function deleteComment(commentId) {
  return client.delete(`/api/comments/${commentId}`);
}

export function batchDeleteComments(ids) {
  return client.post('/api/admin/comments/batch-delete', { ids });
}

export function permanentDeleteComment(commentId) {
  return client.delete(`/api/comments/${commentId}/permanent`);
}

export function toggleSticky(commentId) {
  return client.put(`/api/comments/${commentId}/sticky`);
}

export function likeComment(commentId) {
  return client.post(`/api/comments/${commentId}/like`);
}
