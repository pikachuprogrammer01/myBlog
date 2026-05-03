import client from '@/api/client';

// Public
export function getInterviewCategories() {
  return client.get('/api/interview/categories');
}

export function getInterviewQuestions(params = {}) {
  return client.get('/api/interview/questions', { params });
}

export function getInterviewQuestion(id) {
  return client.get(`/api/interview/questions/${id}`);
}

// Interview comments
export function getInterviewQuestionComments(id) {
  return client.get(`/api/interview/questions/${id}/comments`);
}

export function postInterviewQuestionComment(id, { content, parentId }) {
  return client.post(`/api/interview/questions/${id}/comments`, {
    content,
    parentId: parentId || undefined,
  });
}

// Admin
export function getAdminInterviewQuestions(params = {}) {
  return client.get('/api/admin/interview', { params });
}

export function getAdminInterviewQuestion(id) {
  return client.get(`/api/admin/interview/${id}`);
}

export function createInterviewQuestion(data) {
  return client.post('/api/admin/interview', data);
}

export function updateInterviewQuestion(id, data) {
  return client.put(`/api/admin/interview/${id}`, data);
}

export function deleteInterviewQuestion(id) {
  return client.delete(`/api/admin/interview/${id}`);
}
