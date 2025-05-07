
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, RefreshCw, Play } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

interface TutorContentProps {
  topicId: string;
  topicTitle: string;
}

interface CachedContent {
  content: string;
}

const TutorContent = ({
  topicId,
  topicTitle
}: TutorContentProps) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);
  const [isFromCache, setIsFromCache] = useState(false);
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  
  // Auto scroll to bottom when content updates during streaming
  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content, isStreaming]);

  // Only load content if topic changes AND shouldGenerate is true
  useEffect(() => {
    if (topicId && topicTitle && shouldGenerate) {
      loadContentForTopic();
      // Reset the shouldGenerate flag after generating content
      setShouldGenerate(false);
    }
  }, [topicId, topicTitle, shouldGenerate]);

  // Clear content when selecting a new topic
  useEffect(() => {
    // Clear previous content when topic changes
    setContent("");
    setErrorMessage(null);
    setIsFromCache(false);
    setShouldGenerate(false);
    setIsStreaming(false);
    setStreamProgress(0);
    
    // Cancel any ongoing streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [topicId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const loadContentForTopic = async () => {
    if (!topicId || !topicTitle) return;
    setIsLoading(true);
    setContent(""); // Clear previous content
    setErrorMessage(null);
    setIsFromCache(false);
    
    // Check if we have cached content
    const cachedData = getCachedContent(topicId);
    
    if (cachedData) {
      // Use cached content
      setContent(cachedData.content);
      setIsFromCache(true);
      setIsLoading(false);
    } else {
      // No cache available, generate new content
      await generateStreamingContent();
    }
  };

  const getCachedContent = (topicId: string): CachedContent | null => {
    try {
      const cachedItem = localStorage.getItem(`ai_tutor_${topicId}`);
      
      if (!cachedItem) return null;
      
      const parsedItem: CachedContent = JSON.parse(cachedItem);
      return parsedItem;
    } catch (error) {
      console.error("Error reading from cache:", error);
      return null;
    }
  };

  const cacheContent = (topicId: string, content: string) => {
    try {
      const cacheItem: CachedContent = {
        content
      };
      
      localStorage.setItem(`ai_tutor_${topicId}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error("Error saving to cache:", error);
    }
  };

  const generateStreamingContent = async () => {
    if (!topicId || !topicTitle) return;
    setIsLoading(false);
    setIsStreaming(true);
    setContent(""); // Clear previous content
    setStreamProgress(0);
    setErrorMessage(null);
    setIsFromCache(false);

    try {
      // Create an AbortController to cancel the fetch if needed
      abortControllerRef.current = new AbortController();

      // Create the request body
      const requestBody = {
        topicId,
        topicTitle,
      };

      // Make the function call
      const { data: eventSource, error } = await supabase.functions.invoke(
        "generate-tutor-content",
        {
          body: requestBody
        }
      );

      if (error) {
        console.error("Error invoking function:", error);
        throw new Error(error.message || "Failed to invoke function");
      }
      
      // If the request was aborted during the invoke call, stop processing
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      // Check if the response is a ReadableStream
      if (!(eventSource instanceof ReadableStream)) {
        throw new Error("Expected a streaming response");
      }

      const reader = eventSource.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = "";
      let estimatedCompletion = 0;

      // Process the stream
      while (true) {
        // Check if aborted before reading the next chunk
        if (abortControllerRef.current?.signal.aborted) {
          reader.releaseLock();
          break;
        }

        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const eventChunks = chunk.split("\n\n").filter(Boolean);

        for (const eventChunk of eventChunks) {
          if (eventChunk.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(eventChunk.slice(6));
              
              if (eventData.error) {
                throw new Error(eventData.error);
              }

              if (eventData.content) {
                accumulatedContent += eventData.content;
                setContent(accumulatedContent);
                
                // Update progress (rough estimation)
                estimatedCompletion += eventData.content.length / 20; // Assuming average 2000 chars
                setStreamProgress(Math.min(Math.max(estimatedCompletion, 10), 95));
              }
              
              if (eventData.done) {
                // Save the full content to cache when streaming is complete
                cacheContent(topicId, eventData.fullContent || accumulatedContent);
                setStreamProgress(100);
                setTimeout(() => {
                  setIsStreaming(false);
                }, 500);
              }
            } catch (e) {
              console.error("Error parsing event:", e);
              setErrorMessage("Error parsing response data");
            }
          }
        }
      }

    } catch (error) {
      console.error("Error generating streamed tutor content:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error("Failed to generate tutorial content");
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
      // Don't set abortControllerRef to null here to allow explicit cancellation
    }
  };

  const handleRefresh = () => {
    setShouldGenerate(true);
  };

  const handleGenerateContent = () => {
    setShouldGenerate(true);
  };

  const handleCancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      toast.info("Content generation cancelled");
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2.5 text-primary" />
            <CardTitle className="text-xl font-semibold tracking-tight">Tutorial</CardTitle>
          </div>
          {isFromCache && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh content"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sr-only">Refresh content</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {topicTitle || "Select a topic to begin learning"}
          {isFromCache && <span className="text-xs ml-2 text-muted-foreground">(cached)</span>}
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="p-0 flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isStreaming ? (
          <div className="flex flex-col h-full">
            {/* Streaming progress indicator */}
            <div className="px-4 py-2 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Generating content...</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelStream}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
              <Progress value={streamProgress} className="h-1.5" />
            </div>
            
            {/* Streaming content */}
            <div className="prose prose-sm max-w-none dark:prose-invert p-3 sm:p-6 overflow-auto flex-1">
              {content ? (
                <ReactMarkdown
                  components={{
                    // Code block with syntax highlighting
                    code: ({
                      node,
                      className,
                      children,
                      ...props
                    }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-md border my-4 sm:my-6 text-sm sm:text-[14px] leading-relaxed" showLineNumbers={true} {...props}>
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter> : <code className={cn("bg-muted px-1.5 py-1 rounded-md text-sm font-mono", className)} {...props}>
                                {children}
                              </code>;
                    },
                    // Enhanced headings
                    h1: ({ node, ...props }) => <h1 className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-foreground" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg sm:text-xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3 text-foreground" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-2.5 text-foreground" {...props} />,
                    // Enhanced paragraphs and lists
                    p: ({ node, ...props }) => <p className="my-3 sm:my-4 leading-relaxed text-base text-foreground" {...props} />,
                    ul: ({ node, ...props }) => <ul className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-disc" {...props} />,
                    ol: ({ node, ...props }) => <ol className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-decimal" {...props} />,
                    li: ({ node, ...props }) => <li className="leading-relaxed text-foreground" {...props} />
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <p className="text-center text-muted-foreground">
                  Generating tutorial content for {topicTitle}...
                </p>
              )}
              <div ref={contentEndRef} />
            </div>
          </div>
        ) : topicId && !content ? (
          <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
            <p className="text-base sm:text-lg font-medium mb-4">{topicTitle}</p>
            {errorMessage ? (
              <div className="text-destructive mb-4 text-sm">
                <p>Error: {errorMessage}</p>
              </div>
            ) : null}
            <Button 
              onClick={handleGenerateContent} 
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Generate Content
            </Button>
          </div>
        ) : topicId && content ? (
          <div className="prose prose-sm max-w-none dark:prose-invert p-3 sm:p-6">
            <ReactMarkdown
              components={{
                // Code block with syntax highlighting
                code: ({
                  node,
                  className,
                  children,
                  ...props
                }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return match ? <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" className="rounded-md border my-4 sm:my-6 text-sm sm:text-[14px] leading-relaxed" showLineNumbers={true} {...props}>
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter> : <code className={cn("bg-muted px-1.5 py-1 rounded-md text-sm font-mono", className)} {...props}>
                            {children}
                          </code>;
                },
                // Enhanced headings
                h1: ({ node, ...props }) => <h1 className="text-xl sm:text-2xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4 text-foreground" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg sm:text-xl font-bold mt-5 sm:mt-6 mb-2 sm:mb-3 text-foreground" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base sm:text-lg font-semibold mt-4 sm:mt-5 mb-2 sm:mb-2.5 text-foreground" {...props} />,
                // Enhanced paragraphs and lists
                p: ({ node, ...props }) => <p className="my-3 sm:my-4 leading-relaxed text-base text-foreground" {...props} />,
                ul: ({ node, ...props }) => <ul className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-disc" {...props} />,
                ol: ({ node, ...props }) => <ol className="my-3 sm:my-4 ml-4 sm:ml-6 space-y-1.5 sm:space-y-2 list-decimal" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed text-foreground" {...props} />
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
            <p className="text-base sm:text-lg font-medium mb-2">No topic selected</p>
            <p>Select a topic to view the tutorial content</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TutorContent;
