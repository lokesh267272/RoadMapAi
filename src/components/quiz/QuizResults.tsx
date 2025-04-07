
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, BarChart, Check, X } from "lucide-react";
import { QuizResult } from "./types";
import { useNavigate } from "react-router-dom";

interface QuizResultsProps {
  result: QuizResult;
  topic: string;
  onTryAgain: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({ result, topic, onTryAgain }) => {
  const navigate = useNavigate();
  const percentage = Math.round((result.score / result.totalQuestions) * 100);
  
  const getFeedback = () => {
    if (percentage >= 90) return "Excellent! You've mastered this topic!";
    if (percentage >= 75) return "Great job! You have a strong understanding of the material.";
    if (percentage >= 60) return "Good work! You understand the basics but might need to review some concepts.";
    if (percentage >= 40) return "Keep practicing! You're on the right track but need more review.";
    return "Don't worry! Learning takes time. Try reviewing the material again.";
  };

  return (
    <Card className="bg-glass max-w-3xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Quiz Results</CardTitle>
        <CardDescription className="text-lg">{topic}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-background/50">
          <Award className="h-16 w-16 text-primary mb-4" />
          <h2 className="text-4xl font-bold mb-2">{percentage}%</h2>
          <p className="text-muted-foreground">You answered {result.correctAnswers} out of {result.totalQuestions} questions correctly</p>
        </div>
        
        <div className="p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium mb-2 flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-primary" />
            Feedback
          </h3>
          <p>{getFeedback()}</p>
        </div>

        {result.questionDetails && result.questionDetails.length > 0 && (
          <div className="space-y-4 mt-6">
            <h3 className="text-lg font-medium">Detailed Results</h3>
            {result.questionDetails.map((question, index) => {
              const isCorrect = question.user_answer === question.correct_answer;
              return (
                <Card key={index} className={`border ${isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-base flex-1">
                        <span className="text-primary mr-2">Q{index + 1}.</span> 
                        {question.question}
                      </h4>
                      {isCorrect ? (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Your answer:</span>
                        <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                          {question.user_answer}
                        </span>
                      </div>
                      
                      {!isCorrect && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Correct answer:</span>
                          <span className="text-green-600">{question.correct_answer}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button onClick={onTryAgain}>
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizResults;
