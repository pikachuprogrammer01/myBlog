import client from '@/api/client';

export function askQuestion(question) {
  return client.post('/api/rag/ask', { question }, { timeout: 60000 });
}
