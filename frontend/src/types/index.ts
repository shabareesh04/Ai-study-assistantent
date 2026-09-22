// TypeScript interfaces matching backend schemas

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Document {
  id: number;
  user_id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  has_text: boolean;
}

export interface DocumentDetail extends Document {
  extracted_text?: string;
  summary?: string;
}

export interface SummaryResponse {
  document_id: number;
  summary_type: string;
  content: string;
}

export interface AskResponse {
  document_id: number;
  question: string;
  answer: string;
  conversation_id: number;
}

export interface Conversation {
  id: number;
  document_id: number;
  question: string;
  answer: string;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer?: string;
  explanation?: string;
  user_answer?: string;
}

export interface Quiz {
  id: number;
  user_id: number;
  document_id: number;
  title: string;
  score?: number;
  total_questions: number;
  difficulty: string;
  status: string;
  created_at: string;
  completed_at?: string;
  questions: QuizQuestion[];
  document_name?: string;
}

export interface QuizResult {
  quiz_id: number;
  score: number;
  total_questions: number;
  percentage: number;
  correct: number;
  incorrect: number;
  questions: QuizQuestion[];
}

export interface ShortQuestion {
  question: string;
  answer: string;
}

export interface ExplainResponse {
  topic: string;
  mode: string;
  explanation: string;
}

export interface DashboardStats {
  total_documents: number;
  total_quizzes: number;
  total_questions_answered: number;
  average_score: number;
  best_score: number;
  recent_activity: RecentActivity[];
}

export interface RecentActivity {
  type: string;
  title: string;
  description: string;
  date: string;
  document: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
