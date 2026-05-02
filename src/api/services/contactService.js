import client from '@/api/client';

export function submitContact({ subject, message, email }) {
  return client.post('/api/contact', { subject, message, email });
}

export function getRemaining() {
  return client.get('/api/contact/remaining');
}

export function getContactMessages() {
  return client.get('/api/contact');
}

export function markMessageRead(id) {
  return client.put(`/api/contact/${id}/read`);
}
