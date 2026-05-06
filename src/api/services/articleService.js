import client from '@/api/client';

export function getArticles(params = {}) {
  return client.get('/api/articles', { params });
}

export function getArticleBySlug(slug) {
  return client.get(`/api/articles/${slug}`);
}

export function getCategories() {
  return client.get('/api/categories');
}

export function toggleLike(slug) {
  return client.post(`/api/articles/${slug}/like`);
}

export function getLikeStatus(slug) {
  return client.get(`/api/articles/${slug}/like`);
}

export function toggleBookmark(slug) {
  return client.post(`/api/articles/${slug}/bookmark`);
}

export function getBookmarkStatus(slug) {
  return client.get(`/api/articles/${slug}/bookmark`);
}

export function getBookmarks() {
  return client.get('/api/user/bookmarks');
}

export function getStats() {
  return client.get('/api/stats');
}

export function getTags() {
  return client.get('/api/tags');
}

export function searchSemantic(query) {
  return client.post('/api/search', { query });
}
