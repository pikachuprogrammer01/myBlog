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

export function getTags() {
  return client.get('/api/admin/tags');
}

export function createTag(name) {
  return client.post('/api/admin/tags', { name });
}

export function updateTag(id, name) {
  return client.put(`/api/admin/tags/${id}`, { name });
}

export function deleteTag(id) {
  return client.delete(`/api/admin/tags/${id}`);
}

// Article CRUD
export function getAdminArticleList(params = {}) {
  return client.get('/api/admin/articles', { params });
}

export function getAdminArticle(id) {
  return client.get(`/api/admin/articles/${id}`);
}

export function createAdminArticle(data) {
  return client.post('/api/admin/articles', data);
}

export function updateAdminArticle(id, data) {
  return client.put(`/api/admin/articles/${id}`, data);
}

export function deleteAdminArticle(id) {
  return client.delete(`/api/admin/articles/${id}`);
}

export function uploadArticleMd(file) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post('/api/admin/articles/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
}

export function getCategories() {
  return client.get('/api/categories');
}

// Tools CRUD
export function getTools() {
  return client.get('/api/admin/tools');
}

export function getPublicTools() {
  return client.get('/api/tools');
}

export function createTool(data) {
  return client.post('/api/admin/tools', data);
}

export function updateTool(id, data) {
  return client.put(`/api/admin/tools/${id}`, data);
}

export function deleteTool(id) {
  return client.delete(`/api/admin/tools/${id}`);
}

// Projects CRUD
export function getProjects() {
  return client.get('/api/admin/projects');
}

export function createProject(data) {
  return client.post('/api/admin/projects', data);
}

export function updateProject(id, data) {
  return client.put(`/api/admin/projects/${id}`, data);
}

export function deleteProject(id) {
  return client.delete(`/api/admin/projects/${id}`);
}

// User CRUD
export function getAdminUsers(params = {}) {
  return client.get('/api/admin/users', { params });
}

export function getAdminUser(id) {
  return client.get(`/api/admin/users/${id}`);
}

export function updateAdminUser(id, data) {
  return client.put(`/api/admin/users/${id}`, data);
}

export function deleteAdminUser(id) {
  return client.delete(`/api/admin/users/${id}`);
}

export function resetAdminUserPassword(id) {
  return client.post(`/api/admin/users/${id}/reset-password`);
}
