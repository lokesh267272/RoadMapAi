
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizQuestion as QuizQuestionType } from "./types";
import QuizOption from "./QuizOption";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionIndex: number;
  selectedAnswer: string | null;
  showAnswer: boolean;
  onSelectAnswer: (answer: string) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionIndex,
  selectedAnswer,
  showAnswer,
  onSelectAnswer
}) => {
  return (
    <Card className="bg-glass mb-8">
      <CardHeader>
        <CardTitle className="text-lg flex-wrap">
          <span className="mr-2 text-primary">Q{questionIndex + 1}.</span>
          {question.question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <QuizOption
              key={index}
              option={option}
              isSelected={selectedAnswer === option}
              isCorrect={showAnswer ? option === question.correct_answer : null}
              showAnswer={showAnswer}
              onSelect={() => onSelectAnswer(option)}
              disabled={showAnswer}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizQuestion;
