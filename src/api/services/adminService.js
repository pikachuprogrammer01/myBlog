import client from '@/api/client';

export function getAdminArticles() {
  return client.get('/api/articles', { params: { limit: 100 } });
}

export function getAdminStats() {
  return client.get('/api/admin/stats');
}

export function getAdminComments(params = {}) {
  return client.get('/api/admin/comments', { params });
}

export function getAdminArticleStats() {
  return client.get('/api/admin/articles-stats');
}

export function clearAllComments() {
  return client.delete('/api/admin/comments');
}

export function resetAllData() {
  return client.post('/api/admin/reset');
}

export function testEmailConfig() {
  return client.post('/api/admin/email-test');
}
