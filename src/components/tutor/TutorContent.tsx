
import { useEffect, useState } from "react";
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
import { LoadingAnimation } from "@/components/roadmap/LoadingAnimation";
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
  const [isFromCache, setIsFromCache] = useState(false);
  const [shouldGenerate, setShouldGenerate] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showPulseEffect, setShowPulseEffect] = useState(false);

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
    setIsFromCache(false);
    setShouldGenerate(false);
  }, [topicId]);

  // Progress animation effect for loading
  useEffect(() => {
    if (isLoading) {
      // Simulate progress
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Move faster at beginning, slower as approaching 90%
          const increment = prev < 30 ? 5 : prev < 60 ? 3 : prev < 80 ? 1 : 0.5;
          const newProgress = Math.min(prev + increment, 90);
          return newProgress;
        });
      }, 300);
      
      return () => {
        clearInterval(interval);
        // Reset progress when loading is done
        setLoadingProgress(0);
      };
    }
  }, [isLoading]);

  const loadContentForTopic = async () => {
    if (!topicId || !topicTitle) return;
    setIsLoading(true);
    setContent(""); // Clear previous content
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
      await generateContent();
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

  const generateContent = async () => {
    if (!topicId || !topicTitle) return;
    setIsLoading(true);
    setContent(""); // Clear previous content
    setIsFromCache(false);

    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("generate-tutor-content", {
        body: {
          topicId,
          topicTitle
        }
      });
      
      if (error) throw error;
      
      setContent(data.content);
      
      // Cache the new content
      cacheContent(topicId, data.content);
    } catch (error) {
      console.error("Error generating tutor content:", error);
      toast.error("Failed to generate tutorial content");
      setContent("Failed to load content. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setShouldGenerate(true);
  };

  const handleGenerateContent = () => {
    setShowPulseEffect(true);
    setTimeout(() => setShowPulseEffect(false), 800);
    setShouldGenerate(true);
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
          <div className="flex flex-col items-center justify-center h-64 p-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-center text-muted-foreground mb-3">Generating tutorial content...</p>
            <div className="w-full max-w-xs">
              <Progress value={loadingProgress} className="h-2" />
            </div>
          </div>
        ) : topicId && !content ? (
          <div className="text-center text-muted-foreground p-6 sm:p-12 flex flex-col items-center justify-center h-64">
            <BookOpen className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4 text-muted-foreground/60" />
            <p className="text-base sm:text-lg font-medium mb-4">{topicTitle}</p>
            <Button 
              onClick={handleGenerateContent} 
              className={cn(
                "flex items-center gap-2 transition-all",
                showPulseEffect && "animate-pulse bg-primary/80"
              )}
            >
              <Play className={cn(
                "h-4 w-4",
                showPulseEffect && "animate-fadeInUp" 
              )} />
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
