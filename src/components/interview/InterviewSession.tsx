
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, PhoneOff, Send, MessageSquare, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InterviewSessionProps {
  sessionData: any;
  onComplete: () => void;
}

interface ConversationMessage {
  type: 'ai' | 'user' | 'feedback';
  content: string | any;
  timestamp: Date;
  score?: number;
  improvedAnswer?: string;
}

const InterviewSession = ({ sessionData, onComplete }: InterviewSessionProps) => {
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(sessionData.question);
  const [currentQuestionId, setCurrentQuestionId] = useState(sessionData.questionId);
  const [feedback, setFeedback] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([
    {
      type: 'ai',
      content: sessionData.greeting,
      timestamp: new Date()
    },
    {
      type: 'ai',
      content: sessionData.question,
      timestamp: new Date()
    }
  ]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // For now, we'll use text input. Audio transcription can be added later
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success("Recording started");
    } catch (error) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording stopped");
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setIsProcessing(true);
    
    // Add user response to conversation
    const userMessage: ConversationMessage = {
      type: 'user',
      content: currentAnswer,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('interview-ai', {
        body: {
          action: 'submit_answer',
          sessionId: sessionData.sessionId,
          userInput: currentAnswer
        }
      });

      if (error) throw error;

      setFeedback(data.feedback);
      
      // Add feedback to conversation
      const feedbackMessage: ConversationMessage = {
        type: 'feedback',
        content: data.feedback,
        improvedAnswer: data.improvedAnswer,
        score: data.score,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, feedbackMessage]);

      if (data.isComplete) {
        setIsComplete(true);
        toast.success("Interview completed!");
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion.text);
        setCurrentQuestionId(data.nextQuestion.id);
        
        // Add next question to conversation
        const nextQuestionMessage: ConversationMessage = {
          type: 'ai',
          content: data.nextQuestion.text,
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, nextQuestionMessage]);
      }

      setCurrentAnswer("");
    } catch (error) {
      toast.error("Failed to submit answer");
    } finally {
      setIsProcessing(false);
    }
  };

  const endInterview = () => {
    if (mediaRecorderRef.current && isRecording) {
      stopRecording();
    }
    onComplete();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interview Panel */}
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Interview in Progress</CardTitle>
                  <CardDescription className="text-green-100">
                    Session ID: {sessionData.sessionId.slice(0, 8)}...
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Conversation History */}
              <div className="h-96 overflow-y-auto mb-4 space-y-4 border rounded-lg p-4 bg-gray-50">
                {conversationHistory.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.type === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : message.type === 'feedback'
                        ? 'bg-amber-100 border border-amber-300'
                        : 'bg-white border'
                    }`}>
                      {message.type === 'feedback' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            <span className="font-semibold">Score: {message.score}/5.0</span>
                          </div>
                          <div>
                            <strong>Strengths:</strong>
                            <ul className="list-disc list-inside text-sm">
                              {message.content.strengths?.map((strength: string, i: number) => (
                                <li key={i}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Improvements:</strong>
                            <ul className="list-disc list-inside text-sm">
                              {message.content.improvements?.map((improvement: string, i: number) => (
                                <li key={i}>{improvement}</li>
                              ))}
                            </ul>
                          </div>
                          {message.improvedAnswer && (
                            <div>
                              <strong>Suggested Enhancement:</strong>
                              <p className="text-sm italic bg-blue-50 p-2 rounded mt-1">
                                {message.improvedAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                      <span className="text-xs opacity-70 block mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Answer Input */}
              {!isComplete && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here or use the microphone to record..."
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[100px]"
                    disabled={isProcessing}
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      {isRecording ? "Stop Recording" : "Record Answer"}
                    </Button>
                    
                    <Button
                      onClick={submitAnswer}
                      disabled={!currentAnswer.trim() || isProcessing}
                      className="flex-1"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isProcessing ? "Processing..." : "Submit Answer"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Complete Interview */}
              {isComplete && (
                <div className="text-center py-6">
                  <h3 className="text-xl font-semibold text-green-600 mb-2">
                    Interview Completed!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Great job! Check your detailed feedback and performance analysis.
                  </p>
                  <Button onClick={endInterview} className="bg-green-600 hover:bg-green-700">
                    View Results & Exit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Current Question */}
          {!isComplete && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Current Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{currentQuestion}</p>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {feedback && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Latest Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Communication</span>
                  <Badge variant="outline">
                    {feedback.communication?.clarity || 'N/A'}/5.0
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Content Quality</span>
                  <Badge variant="outline">
                    {feedback.content?.relevance || 'N/A'}/5.0
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Structure</span>
                  <Badge variant="outline">
                    {feedback.communication?.structure || 'N/A'}/5.0
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <Button 
                onClick={endInterview} 
                variant="destructive" 
                className="w-full"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                End Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InterviewSession;
