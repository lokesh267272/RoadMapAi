
export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export interface QuizResponse {
  quiz: Quiz;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  selectedAnswers: Record<number, string>;
}
