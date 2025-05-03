
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, User, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TutorChatProps {
  topicId: string;
  topicTitle: string;
}

const TutorChat = ({ topicId, topicTitle }: TutorChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message when topic changes
  useEffect(() => {
    if (topicId && topicTitle) {
      const welcomeMessage = {
        id: `welcome-${topicId}`,
        role: "assistant" as const,
        content: `Welcome to the AI Tutor for "${topicTitle}". What questions do you have about this topic?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
    }
  }, [topicId, topicTitle]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!newMessage.trim() || !topicId || isLoading) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-tutor-response", {
        body: {
          topicId,
          topicTitle,
          message: userMessage.content,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        },
      });

      if (error) throw error;
      
      const aiResponse = {
        id: `ai-${Date.now()}`,
        role: "assistant" as const,
        content: data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error("Error getting AI tutor response:", error);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center mb-1">
          <MessageSquare className="w-5 h-5 mr-2 text-primary" />
          <CardTitle className="text-lg">AI Tutor Chat</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask questions about {topicTitle || "your selected topic"}
        </p>
      </CardHeader>
      <Separator />
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "You" : "AI Tutor"}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        // Code block with syntax highlighting
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter 
                              style={vscDarkPlus} 
                              language={match[1]} 
                              PreTag="div"
                              className="rounded-md border text-xs"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 pt-2">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Input
            placeholder={isLoading ? "AI is typing..." : "Ask a question..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading || !topicId}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !newMessage.trim() || !topicId}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default TutorChat;
