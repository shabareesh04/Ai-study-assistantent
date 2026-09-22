import axios from 'axios';
import type {
  Document, DocumentDetail, SummaryResponse, AskResponse,
  Conversation, Quiz, QuizResult, ShortQuestion,
  ExplainResponse, DashboardStats, User, Token,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<User>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<Token>('/api/auth/login', data),

  getMe: () => api.get<User>('/api/auth/me'),
};

// ─── Documents ───────────────────────────────────────────────────────────────

export const documentsAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<Document>('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  list: () => api.get<Document[]>('/api/documents'),

  get: (id: number) => api.get<DocumentDetail>(`/api/documents/${id}`),

  delete: (id: number) => api.delete(`/api/documents/${id}`),
};

// ─── AI Features ─────────────────────────────────────────────────────────────

export const aiAPI = {
  summary: (documentId: number, summaryType: string = 'detailed') =>
    api.post<SummaryResponse>(`/api/documents/${documentId}/summary`, {
      summary_type: summaryType,
    }),

  ask: (documentId: number, question: string) =>
    api.post<AskResponse>(`/api/documents/${documentId}/ask`, { question }),

  getConversations: (documentId: number) =>
    api.get<Conversation[]>(`/api/documents/${documentId}/conversations`),

  generateShortQuestions: (documentId: number, numQuestions: number = 5) =>
    api.post<{ document_id: number; questions: ShortQuestion[] }>(
      `/api/documents/${documentId}/generate-short-questions`,
      { num_questions: numQuestions }
    ),

  explain: (topic: string, mode: string = 'simple', documentId?: number) =>
    api.post<ExplainResponse>('/api/explain', {
      topic,
      mode,
      document_id: documentId,
    }),
};

// ─── Quizzes ─────────────────────────────────────────────────────────────────

export const quizzesAPI = {
  generate: (documentId: number, numQuestions: number = 5, difficulty: string = 'medium') =>
    api.post<Quiz>(`/api/documents/${documentId}/generate-mcq`, {
      num_questions: numQuestions,
      difficulty,
    }),

  list: () => api.get<Quiz[]>('/api/quizzes'),

  get: (id: number) => api.get<Quiz>(`/api/quizzes/${id}`),

  submit: (quizId: number, answers: Record<string, string>) =>
    api.post<QuizResult>(`/api/quizzes/${quizId}/submit`, { answers }),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardAPI = {
  getStats: () => api.get<DashboardStats>('/api/dashboard/stats'),
};

export default api;
