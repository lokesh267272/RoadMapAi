
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import TutorialRenderer from "./TutorialRenderer";
import TutorialLoading from "./TutorialLoading";
import TutorialEmptyState from "./TutorialEmptyState";
import TutorialPlaceholder from "./TutorialPlaceholder";
import { getCachedContent, cacheContent } from "./utils/contentCache";

// Cache expiration time (24 hours in milliseconds)
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000;

interface TutorContentProps {
  topicId: string;
  topicTitle: string;
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
          <TutorialLoading progress={loadingProgress} />
        ) : topicId && !content ? (
          <TutorialEmptyState 
            topicTitle={topicTitle} 
            onGenerate={handleGenerateContent} 
            showPulseEffect={showPulseEffect} 
          />
        ) : topicId && content ? (
          <TutorialRenderer content={content} />
        ) : (
          <TutorialPlaceholder />
        )}
      </CardContent>
    </Card>
  );
};

export default TutorContent;
