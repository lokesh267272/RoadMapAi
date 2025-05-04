
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, MessageSquare, User, Bot, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface CachedMessages {
  messages: Message[];
  timestamp: number;
}

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

const TutorChat = ({ topicId, topicTitle }: TutorChatProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from cache or initialize with welcome message when topic changes
  useEffect(() => {
    if (topicId && topicTitle) {
      loadMessagesForTopic();
    }
  }, [topicId, topicTitle]);

  const loadMessagesForTopic = () => {
    if (!topicId || !topicTitle) return;
    
    // Try to get cached messages for this topic
    const cachedData = getCachedMessages(topicId);
    
    if (cachedData && cachedData.messages.length > 0) {
      // Use cached messages
      setMessages(cachedData.messages);
      setIsFromCache(true);
    } else {
      // No cache available, initialize with welcome message
      const welcomeMessage = {
        id: `welcome-${topicId}`,
        role: "assistant" as const,
        content: `Welcome to the AI Tutor for "${topicTitle}". What questions do you have about this topic?`,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      setIsFromCache(false);
      
      // Cache this initial message
      cacheMessages(topicId, [welcomeMessage]);
    }
  };

  const getCachedMessages = (topicId: string): CachedMessages | null => {
    try {
      const cachedItem = localStorage.getItem(`ai_tutor_chat_${topicId}`);
      
      if (!cachedItem) return null;
      
      const parsedItem: CachedMessages = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache is expired
      if (now - parsedItem.timestamp > CACHE_EXPIRATION) {
        // Cache expired, remove it
        localStorage.removeItem(`ai_tutor_chat_${topicId}`);
        return null;
      }
      
      // Convert string timestamps back to Date objects
      const messagesWithDates = parsedItem.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      
      return {
        ...parsedItem,
        messages: messagesWithDates
      };
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  };

  const cacheMessages = (topicId: string, messages: Message[]) => {
    try {
      const cacheItem: CachedMessages = {
        messages,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`ai_tutor_chat_${topicId}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

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
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage("");
    setIsLoading(true);
    setTypingIndicator(true);
    
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
      
      // Short delay to make the response feel more natural
      await new Promise(resolve => setTimeout(resolve, 800));
      setTypingIndicator(false);
      
      const aiResponse = {
        id: `ai-${Date.now()}`,
        role: "assistant" as const,
        content: data.response,
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      // Update the cache with the new messages
      cacheMessages(topicId, finalMessages);
    } catch (error) {
      console.error("Error getting AI tutor response:", error);
      setTypingIndicator(false);
      toast.error("Failed to get a response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshChat = () => {
    // Clear cache for this topic and reset to initial welcome message
    localStorage.removeItem(`ai_tutor_chat_${topicId}`);
    const welcomeMessage = {
      id: `welcome-${topicId}`,
      role: "assistant" as const,
      content: `Welcome to the AI Tutor for "${topicTitle}". What questions do you have about this topic?`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setIsFromCache(false);
    
    // Cache this initial message
    cacheMessages(topicId, [welcomeMessage]);
    toast.success("Chat history reset");
  };

  const TypingIndicator = () => (
    <div className="flex max-w-[80%] rounded-2xl p-3 bg-muted">
      <div className="flex items-center gap-2 mb-1">
        <Bot className="h-4 w-4" />
        <span className="text-xs font-medium">AI Tutor</span>
      </div>
      <div className="flex items-center ml-2">
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
        <span className="typing-dot"></span>
      </div>
    </div>
  );

  return (
    <Card className={cn(
      "h-full flex flex-col shadow-md",
      isMobile && "rounded-t-xl rounded-b-none border-b-0"
    )}>
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageSquare className="w-5 h-5 mr-2.5 text-primary" />
            <CardTitle className="text-xl font-semibold tracking-tight">AI Tutor Chat</CardTitle>
          </div>
          {messages.length > 1 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefreshChat} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Reset chat"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Reset chat</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions about {topicTitle || "your selected topic"}
          {isFromCache && messages.length > 1 && <span className="text-xs ml-2 text-muted-foreground">(cached)</span>}
        </p>
      </CardHeader>
      <Separator />
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 shadow-sm",
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                    {message.role === "user" ? (
                      <User className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    ) : (
                      <Bot className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                    )}
                    <span className="text-xs font-medium">
                      {message.role === "user" ? "You" : "AI Tutor"}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      components={{
                        // Enhanced table rendering
                        table: ({ node, ...props }) => (
                          <div className="w-full overflow-x-auto my-2 sm:my-3">
                            <Table {...props} className="border border-border rounded-md w-full text-foreground text-xs sm:text-sm" />
                          </div>
                        ),
                        thead: ({ node, ...props }) => <TableHeader {...props} />,
                        tbody: ({ node, ...props }) => <TableBody {...props} />,
                        tr: ({ node, ...props }) => <TableRow {...props} className="hover:bg-muted/10" />,
                        th: ({ node, ...props }) => (
                          <TableHead 
                            className="font-semibold p-1.5 sm:p-2 border-b border-r border-border last:border-r-0 text-foreground bg-muted/30" 
                            {...props} 
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <TableCell 
                            className="p-1.5 sm:p-2 border-r border-border last:border-r-0 align-middle" 
                            {...props} 
                          />
                        ),
                        
                        // Code block with syntax highlighting
                        code: ({ node, className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          return match ? (
                            <SyntaxHighlighter 
                              style={vscDarkPlus} 
                              language={match[1]} 
                              PreTag="div"
                              className="rounded-md border text-xs my-2 sm:my-3"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={cn("bg-muted-foreground/10 px-1.5 py-0.5 rounded-md text-sm font-mono", className)} {...props}>
                              {children}
                            </code>
                          );
                        },
                        
                        // Enhanced paragraphs and lists
                        p: ({ node, ...props }) => (
                          <p className="my-2 sm:my-3 leading-relaxed text-sm sm:text-base" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="my-2 sm:my-3 ml-4 sm:ml-5 space-y-1.5 sm:space-y-2 list-disc" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="my-2 sm:my-3 ml-4 sm:ml-5 space-y-1.5 sm:space-y-2 list-decimal" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {typingIndicator && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-2 sm:pt-3">
        <form onSubmit={handleSendMessage} className="w-full flex gap-2 sm:gap-3">
          <Input
            placeholder={isLoading ? "AI is thinking..." : "Ask a question..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading || !topicId}
            className="flex-1 rounded-full text-sm"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !newMessage.trim() || !topicId}
            size="icon"
            className="rounded-full h-9 sm:h-10 w-9 sm:w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default TutorChat;
