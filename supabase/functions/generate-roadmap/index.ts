import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MAX_CHUNK_SIZE = 30; // Maximum days to request in a single API call
const MAX_ALLOWED_DAYS = 60; // Maximum allowed duration for roadmap generation

// Updated CORS headers with specific allowed domains
const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get("ENVIRONMENT") === "production" 
    ? "https://roadmapai.netlify.app"
    : "http://localhost:8080",
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

// Helper function to check if the origin is allowed
function getAllowedOrigin(requestOrigin: string | null): string {
  if (!requestOrigin) return corsHeaders["Access-Control-Allow-Origin"];
  
  const allowedOrigins = [
    "https://roadmapai.netlify.app",
    "https://preview--roadmapai.lovable.app", 
    "http://localhost:8080"
  ];
  
  return allowedOrigins.includes(requestOrigin) 
    ? requestOrigin 
    : corsHeaders["Access-Control-Allow-Origin"];
}

// Type definitions
interface Resource {
  type: string;
  title: string;
  url: string;
}

interface Topic {
  day: number;
  topic: string;
  content: string;
  resources: Resource[];
}

interface Roadmap {
  title: string;
  topics: Topic[];
}

// URL validation and improvement helper
function validateAndImproveUrl(url: string, type: string, title: string): string {
  try {
    // Ensure URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Parse the URL to validate its format
    const parsedUrl = new URL(url);

    // Handle YouTube URLs
    if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
      // Extract video ID from various YouTube URL formats
      let videoId = '';
      if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.slice(1);
      } else {
        videoId = parsedUrl.searchParams.get('v') || '';
      }

      // If we have a valid video ID, construct a search URL instead
      if (videoId) {
        return `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
      }
    }

    // Handle Google search URLs
    if (parsedUrl.hostname.includes('google.com')) {
      // Ensure search query is properly encoded
      const searchQuery = parsedUrl.searchParams.get('q') || title;
      return `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    }

    // Validate URL format
    if (!parsedUrl.protocol || !parsedUrl.hostname) {
      throw new Error('Invalid URL format');
    }

    return url;
  } catch (error) {
    console.warn(`Invalid URL detected: ${url}. Falling back to search URL.`);
    // Return a search URL based on the resource type and title
    if (type === 'video') {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;
    } else {
      return `https://www.google.com/search?q=${encodeURIComponent(title)}`;
    }
  }
}

// Helper function to validate and improve resources
function validateAndImproveResources(resources: Resource[]): Resource[] {
  return resources.map(resource => ({
    ...resource,
    url: validateAndImproveUrl(resource.url, resource.type, resource.title)
  }));
}

// Helper for exponential backoff retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, baseDelay = 500): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status >= 500 || response.status === 429) {
        // Retry on server errors or rate limiting
        if (attempt < maxRetries) {
          await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
          attempt++;
          continue;
        }
      }
      // For other errors, or if out of retries, throw
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    } catch (err) {
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, baseDelay * Math.pow(2, attempt)));
        attempt++;
      } else {
        throw err;
      }
    }
  }
}

// Helper function to clean and parse JSON string
function cleanAndParseJson(jsonStr: string): Roadmap {
  // Remove markdown code block syntax if present
  jsonStr = jsonStr.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '');
  
  // Extract just the JSON part
  const jsonStartPos = jsonStr.indexOf('{');
  const jsonEndPos = jsonStr.lastIndexOf('}') + 1;
  if (jsonStartPos !== -1 && jsonEndPos !== 0) {
    jsonStr = jsonStr.substring(jsonStartPos, jsonEndPos);
  }
  
  // Fix common JSON syntax errors
  jsonStr = jsonStr
    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
    .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
    .replace(/\\"/g, '"')    // Fix escaped quotes
    .replace(/([{,]\s*)('|")([^'"]+)('|")(\s*:)/g, '$1"$3"$5'); // Ensure property names are double-quoted
  
  return JSON.parse(jsonStr);
}

// Helper function to generate fallback topic
function generateFallbackTopic(day: number, goal: string, totalDays: number): Topic {
  const phase = day <= totalDays/3 ? 'Fundamentals' : 
                day <= totalDays*2/3 ? 'Intermediate Concepts' : 'Advanced Techniques';
  const topic = {
    day,
    topic: `Day ${day}: ${goal} ${phase}`,
    content: `Building on previous concepts and practicing ${goal} skills further.`,
    resources: [
      {
        type: "doc",
        title: `${goal} Practice Guide`,
        url: `https://www.google.com/search?q=${encodeURIComponent(`${goal} practice exercises day ${day}`)}`
      },
      {
        type: "video",
        title: `${goal} ${phase} Tutorial`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${goal} ${phase.toLowerCase()} tutorial`)}`
      }
    ]
  };
  
  // Validate and improve the resources
  topic.resources = validateAndImproveResources(topic.resources);
  return topic;
}

// Helper function to validate and fix roadmap structure
function validateRoadmapStructure(roadmap: Roadmap, requestedDuration: number, goal: string): Roadmap {
  if (!roadmap.topics || !Array.isArray(roadmap.topics)) {
    throw new Error("Invalid roadmap structure: missing topics array");
  }

  // Sort topics by day number
  roadmap.topics.sort((a, b) => a.day - b.day);
  
  // Ensure each day has a unique day number from 1 to requestedDuration
  const validatedTopics: Topic[] = [];
  const seenDays = new Set<number>();
  
  for (const topic of roadmap.topics) {
    if (!seenDays.has(topic.day) && topic.day <= requestedDuration) {
      // Validate and improve resources for each topic
      const validatedTopic = {
        ...topic,
        resources: validateAndImproveResources(topic.resources)
      };
      validatedTopics.push(validatedTopic);
      seenDays.add(topic.day);
    }
  }
  
  // Fill in any missing days
  for (let day = 1; day <= requestedDuration; day++) {
    if (!seenDays.has(day)) {
      validatedTopics.push(generateFallbackTopic(day, goal, requestedDuration));
    }
  }
  
  // Sort again to ensure correct order
  validatedTopics.sort((a, b) => a.day - b.day);
  
  return {
    title: roadmap.title || `${goal} Learning Path (${requestedDuration} Days)`,
    topics: validatedTopics.slice(0, requestedDuration)
  };
}

serve(async (req) => {
  // Set dynamic origin based on request
  const requestOrigin = req.headers.get("origin");
  const dynamicCorsHeaders = {
    ...corsHeaders,
    "Access-Control-Allow-Origin": getAllowedOrigin(requestOrigin)
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: dynamicCorsHeaders });
  }

  try {
    const { goal, duration, description } = await req.json();
    const requestedDuration = Math.min(parseInt(duration) || 30, MAX_ALLOWED_DAYS);
    console.log(`Received request to generate roadmap for: ${goal} with duration: ${requestedDuration} days, details: ${description || 'None'}`);

    if (!goal) {
      throw new Error('Missing required parameter: goal');
    }

    if (requestedDuration > MAX_ALLOWED_DAYS) {
      throw new Error(`Duration cannot exceed ${MAX_ALLOWED_DAYS} days`);
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error('API configuration error - please contact administrator');
    }

    // For large durations, break into chunks
    const requiredChunks = Math.ceil(requestedDuration / MAX_CHUNK_SIZE);
    let finalRoadmap: Roadmap = {
      title: "",
      topics: []
    };

    for (let chunkIndex = 0; chunkIndex < requiredChunks; chunkIndex++) {
      const startDay = chunkIndex * MAX_CHUNK_SIZE + 1;
      const endDay = Math.min((chunkIndex + 1) * MAX_CHUNK_SIZE, requestedDuration);
      const chunkDuration = endDay - startDay + 1;
      
      console.log(`Generating chunk ${chunkIndex + 1}/${requiredChunks}: days ${startDay}-${endDay}`);
      
      // Generate chunk-specific prompt with context from previous chunk
      const details = description || '';
      let contextSummary = "";
      if (chunkIndex > 0 && finalRoadmap.topics.length > 0) {
        // Use the last 1-2 topics as context
        const lastTopics = finalRoadmap.topics.slice(-2);
        contextSummary = `\n\nContext from previous days:\n` +
          lastTopics.map(t =>
            `Day ${t.day}: ${t.topic} - ${t.content} (Resources: ${t.resources.map(r => r.title).join(', ')})`
          ).join('\n');
      }

      const prompt = `
Create a detailed and progressive learning roadmap for the goal: "${goal}" over a period of ${chunkDuration} days.

${chunkIndex > 0 ? `This is part ${chunkIndex + 1} of the roadmap, covering days ${startDay}-${endDay} of the full ${requestedDuration}-day plan. Make sure to continue where the previous part left off, assuming steady progression.` : ''}
${contextSummary}

Additional user info: "${details || 'No additional information provided'}"

Based on the above, adjust the roadmap as follows:
- If the user mentions they already have knowledge (e.g., "I know DSA basics", "I have experience with X"), skip beginner topics and start from intermediate level.
- ${details?.toLowerCase().includes("i know") || details?.toLowerCase().includes("i have") || details?.toLowerCase().includes("familiar with") || details?.toLowerCase().includes("experienced") ? '' : 'Assume the user is a complete beginner and start from scratch.'}
- ${chunkIndex > 0 ? 'Continue progressing difficulty from intermediate to advanced level.' : ''}
- Add a small project or assignment every 7th day to consolidate learning and apply knowledge in real-world scenarios.
- Avoid generic or vague entries like "Continue Learning". Each day should have a clear, unique topic.
- The learning should progress logically, with each day introducing a distinct concept, skill, or challenge.

Each day must include:
- A specific topic title
- A clear explanation of what the user should learn and why
- At least 2 real and relevant resources (video, doc, blog) with working URLs

Format your response as valid JSON:
{
  ${chunkIndex === 0 ? '"title": "A descriptive and motivational title for the roadmap",' : ''}
  "topics": [
    {
      "day": ${startDay},
      "topic": "Topic title for day ${startDay}",
      "content": "Clear explanation of what to learn and why it matters.",
      "resources": [
        {
          "type": "doc",
          "title": "Documentation or Article Title", 
          "url": "https://..."
        },
        {
          "type": "video",
          "title": "Video Title",
          "url": "https://youtube.com/..."
        }
      ]
    },
    ...
    {
      "day": ${endDay},
      "topic": "${endDay === requestedDuration ? 'Final day topic' : `Topic for day ${endDay}`}",
      "content": "${endDay === requestedDuration ? 'Wrap-up advanced topic or project to showcase all learned skills.' : `Content for day ${endDay}`}",
      "resources": [
        {
          "type": "doc",
          "title": "${endDay === requestedDuration ? 'Advanced Article' : 'Article Title'}",
          "url": "https://..."
        },
        {
          "type": "video",
          "title": "${endDay === requestedDuration ? 'Final Project Walkthrough' : 'Video Tutorial'}",
          "url": "https://youtube.com/..."
        }
      ]
    }
  ]
}

Important:
- Return only a valid JSON object — no code block, markdown, or explanations.
- Output must contain exactly ${chunkDuration} days of unique learning content.
- No trailing commas or syntax issues.
- At least 2 resources per topic, with real and relevant URLs.
`;

      console.log(`Sending request to Gemini API for chunk ${chunkIndex + 1}...`);
      const response = await fetchWithRetry(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192
            }
          })
        }
      );

      const data = await response.json();
      console.log(`Received response from Gemini API for chunk ${chunkIndex + 1}`);
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error(`Unexpected Gemini API response structure for chunk ${chunkIndex + 1}:`, JSON.stringify(data));
        throw new Error("Unexpected response from Gemini API");
      }

      try {
        const textContent = data.candidates[0].content.parts[0].text;
        console.log(`Processing text content for chunk ${chunkIndex + 1}...`);
        
        let chunkData: Roadmap;
        try {
          chunkData = cleanAndParseJson(textContent);
        } catch (jsonError) {
          console.error(`Failed standard JSON parse for chunk ${chunkIndex + 1}:`, jsonError);
          console.log("Attempting manual JSON reconstruction...");
          
          // Manual JSON extraction as fallback
          const dayPattern = /"day":\s*(\d+)/g;
          let match;
          let topics: Topic[] = [];
          
          while ((match = dayPattern.exec(textContent)) !== null) {
            const dayNumber = parseInt(match[1]);
            const startPos = match.index;
            
            // Find the opening brace before this day
            let braceCount = 0;
            let objectStart = startPos;
            while (objectStart > 0) {
              objectStart--;
              if (textContent[objectStart] === '{') {
                if (braceCount === 0) break;
                braceCount--;
              } else if (textContent[objectStart] === '}') {
                braceCount++;
              }
            }
            
            // Find the closing brace
            braceCount = 1;
            let objectEnd = objectStart + 1;
            while (objectEnd < textContent.length && braceCount > 0) {
              if (textContent[objectEnd] === '{') braceCount++;
              else if (textContent[objectEnd] === '}') braceCount--;
              objectEnd++;
            }
            
            if (braceCount === 0) {
              try {
                const topicJson = textContent.substring(objectStart, objectEnd);
                const topic = JSON.parse(topicJson);
                if (topic.day && topic.topic && topic.content && topic.resources) {
                  topics.push(topic as Topic);
                }
              } catch (e) {
                console.error(`Failed to parse individual day ${dayNumber}:`, e);
              }
            }
          }
          
          chunkData = {
            title: chunkIndex === 0 ? `${goal} Learning Path (${requestedDuration} Days)` : finalRoadmap.title,
            topics
          };
        }

        // For first chunk, set the title
        if (chunkIndex === 0 && chunkData.title) {
          finalRoadmap.title = chunkData.title;
        } else if (!finalRoadmap.title) {
          finalRoadmap.title = `${goal} Learning Path (${requestedDuration} Days)`;
        }
        
        // Add the topics to our final roadmap
        finalRoadmap.topics = [...finalRoadmap.topics, ...chunkData.topics];
        
      } catch (parseError) {
        console.error(`Failed to parse Gemini response for chunk ${chunkIndex + 1}:`, parseError);
        // Generate fallback data for this chunk
        for (let i = startDay; i <= endDay; i++) {
          finalRoadmap.topics.push(generateFallbackTopic(i, goal, requestedDuration));
        }
      }
    }

    // Validate and fix the final roadmap structure
    finalRoadmap = validateRoadmapStructure(finalRoadmap, requestedDuration, goal);

    return new Response(JSON.stringify({ roadmap: finalRoadmap }), {
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    
    // Create a fallback roadmap
    const requestedDuration = parseInt(req.duration) || 30;
    const fallbackGoal = req.goal || 'Learning';
    
    const fallbackRoadmap = {
      title: `${fallbackGoal} Plan`,
      topics: Array.from({ length: requestedDuration }, (_, i) => 
        generateFallbackTopic(i + 1, fallbackGoal, requestedDuration)
      )
    };
    
    return new Response(JSON.stringify({
      error: error.message || "Failed to generate roadmap",
      roadmap: fallbackRoadmap
    }), {
      status: 200, // Return 200 even on error, but include the error message
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
