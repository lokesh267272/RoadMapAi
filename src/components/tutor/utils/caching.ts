
interface CachedContent {
  content: string;
}

/**
 * Retrieves cached content for a topic from localStorage
 */
export const getCachedContent = (topicId: string): CachedContent | null => {
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

/**
 * Caches content for a topic in localStorage
 */
export const cacheContent = (topicId: string, content: string) => {
  try {
    const cacheItem: CachedContent = {
      content
    };
    
    localStorage.setItem(`ai_tutor_${topicId}`, JSON.stringify(cacheItem));
  } catch (error) {
    console.error("Error saving to cache:", error);
  }
};
