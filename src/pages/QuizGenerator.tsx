
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Book, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizResults from "@/components/quiz/QuizResults";
import { Quiz, QuizQuestion as QuizQuestionType, QuizResult } from "@/components/quiz/types";

const QuizGenerator = () => {
  const [searchParams] = useSearchParams();
  const topic = searchParams.get("topic") || "";
  const topicId = searchParams.get("id") || "";
  const roadmapId = searchParams.get("roadmapId") || "";
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (!topic) {
      setError("No topic specified");
      setIsLoading(false);
      return;
    }

    const generateQuiz = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('generate-quiz', {
          body: { 
            topic,
            roadmapId,
            topicId 
          }
        });

        if (error) throw new Error(error.message);
        
        setQuiz(data.quiz);
      } catch (err: any) {
        console.error("Error generating quiz:", err);
        setError(err.message || "Failed to generate quiz");
        toast.error("Failed to generate quiz");
      } finally {
        setIsLoading(false);
      }
    };

    generateQuiz();
  }, [topic, topicId, roadmapId]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitQuiz = () => {
    if (!quiz) return;

    const correctAnswers = quiz.questions.filter((q, index) => 
      selectedAnswers[index] === q.correct_answer
    ).length;

    const score = correctAnswers / quiz.questions.length;

    const result: QuizResult = {
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      selectedAnswers
    };

    setQuizResult(result);
    setShowResults(true);
    setShowAnswers(true);
  };

  const handleTryAgain = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setShowAnswers(false);
    setQuizResult(null);
  };

  const allQuestionsAnswered = quiz ? 
    Object.keys(selectedAnswers).length === quiz.questions.length : 
    false;

  if (isLoading) {
    return (
      <div className="min-h-screen pt-16 pb-8 flex justify-center items-center">
        <Card className="bg-glass max-w-md mx-auto text-center p-6">
          <CardContent className="pt-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg">Generating quiz for "{topic}"...</p>
            <p className="text-sm text-muted-foreground mt-2">This might take a moment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-16 pb-8 flex justify-center items-center">
        <Card className="bg-glass max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="flex justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-2" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen pt-16 pb-8 flex justify-center items-center">
        <Card className="bg-glass max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Unable to generate quiz content</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-16 pb-8 animate-fadeInUp">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </div>

        {!showResults ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2 mb-2">
                <Book className="h-7 w-7 text-primary" />
                Quiz: {quiz.topic}
              </h1>
              <p className="text-muted-foreground">
                Test your knowledge with these questions
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              {quiz.questions.map((question: QuizQuestionType, index) => (
                <QuizQuestion
                  key={index}
                  question={question}
                  questionIndex={index}
                  selectedAnswer={selectedAnswers[index] || null}
                  showAnswer={showAnswers}
                  onSelectAnswer={(answer) => handleSelectAnswer(index, answer)}
                />
              ))}

              <div className="flex justify-center mt-8 mb-16">
                <Button 
                  size="lg"
                  onClick={handleSubmitQuiz}
                  disabled={!allQuestionsAnswered}
                >
                  Submit Quiz
                </Button>
              </div>
            </div>
          </>
        ) : quizResult && (
          <QuizResults 
            result={quizResult} 
            topic={quiz.topic} 
            onTryAgain={handleTryAgain} 
          />
        )}
      </div>
    </div>
  );
};

export default QuizGenerator;
