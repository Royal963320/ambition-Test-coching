
export interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface StudentResult {
  id: string;
  studentId: string;
  name: string;
  shift: string;
  testMode: 'MCQ' | 'TYPING';
  score?: number;
  totalQuestions?: number;
  accuracy?: number;
  wpm?: number;
  timestamp: string;
}

export interface TestSettings {
  title: string;
  subject: string;
  subSubject?: string;
  date: string;
  timeLimit: number; // in minutes
  strictMode: boolean;
  testMode: 'MCQ' | 'TYPING';
  typingText?: string;
  frequency: string;
}

// Added TestConfig interface for AI question generation configuration
export interface TestConfig {
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: 'English' | 'Hindi' | 'Hinglish';
  questionCount: number;
}

export enum UserRole {
  NONE = 'NONE',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN'
}

export enum AppState {
  WELCOME = 'WELCOME',
  STUDENT_INFO = 'STUDENT_INFO',
  DASHBOARD = 'DASHBOARD',
  TESTING = 'TESTING',
  RESULT = 'RESULT'
}
