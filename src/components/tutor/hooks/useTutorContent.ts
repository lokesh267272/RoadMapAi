
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCachedContent, cacheContent } from "../utils/caching";

export const useTutorContent = (topicId: string, topicTitle: string) => {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  // Try to load from cache or generate content when topic changes
  useEffect(() => {
    if (topicId && topicTitle) {
      loadContentForTopic();
    }
  }, [topicId, topicTitle]);

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

  return {
    content,
    isLoading,
    isFromCache,
    generateContent
  };
};
