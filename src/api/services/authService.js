import client from '@/api/client';

export function login(username, password) {
  return client.post('/api/auth/login', { username, password });
}

export function register(username, password) {
  return client.post('/api/auth/register', { username, password });
}

export function getProfile() {
  return client.get('/api/auth/profile');
}

export function uploadAvatar(imageBase64) {
  return client.put('/api/auth/avatar', { image: imageBase64 });
}

export function deleteAvatar() {
  return client.delete('/api/auth/avatar');
}
