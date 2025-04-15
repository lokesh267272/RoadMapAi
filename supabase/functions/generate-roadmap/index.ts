
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, duration } = await req.json();
    console.log(`Received request to generate roadmap for: ${goal} with duration: ${duration} days`);

    if (!goal) {
      throw new Error('Missing required parameter: goal');
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error('API configuration error - please contact administrator');
    }

    const prompt = `
      Create a detailed learning roadmap for: "${goal}" over a period of ${duration || 30} days.
      
      Structure your response strictly as a valid JSON object with the following format:
      {
        "title": "A descriptive and motivational title for the roadmap",
        "topics": [
          {
            "day": 1,
            "topic": "Topic title for day 1",
            "content": "Clear, concise, and actionable description of what the user should learn or build on day 1",
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
          {
            "day": 2,
            "topic": "Topic title for day 2",
            "content": "What to learn, why it's important, and how it connects to the previous day",
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
          }
        ]
      }
      
      Important: You must return ONLY a valid JSON object with nothing else before or after.
      Do not include any markdown formatting, code blocks, or explanatory text.
      Your entire response must be parseable as JSON.
      
      Remember the roadmap should adapt to exactly ${duration || 30} days - no more, no less.
      For each topic, include at least 2-3 learning resources with accurate URLs.
      Ensure each day has a clear learning objective that builds on previous days.
      
      Response must be valid JSON with no trailing commas or other syntax errors.
    `;

    console.log("Sending request to Gemini API...");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorData);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API");

    // Check if the response has the expected structure
    if (!data.candidates || !data.candidates[0]?.content?.parts || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error("Unexpected Gemini API response structure:", JSON.stringify(data));
      throw new Error("Unexpected response from Gemini API");
    }

    // Extract the JSON string from the response with improved error handling
    let roadmapData;
    try {
      const textContent = data.candidates[0].content.parts[0].text;
      // Try to extract JSON if wrapped in backticks or other markdown
      console.log("Processing text content...");
      
      // Clean up the response to handle potential markdown or text formatting
      let jsonStr = textContent.trim();
      
      // Remove markdown code block syntax if present
      jsonStr = jsonStr.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '');
      
      // Remove any potential text before or after the JSON
      const jsonStartPos = jsonStr.indexOf('{');
      const jsonEndPos = jsonStr.lastIndexOf('}') + 1;
      
      if (jsonStartPos !== -1 && jsonEndPos !== 0) {
        jsonStr = jsonStr.substring(jsonStartPos, jsonEndPos);
      }
      
      // Fix common JSON syntax errors that might occur
      jsonStr = jsonStr
        .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
        .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/\\"/g, '\\\\"'); // Fix double quotes
      
      console.log("Attempting to parse JSON...");
      roadmapData = JSON.parse(jsonStr);
      
      console.log("Successfully parsed roadmap data");
      
      // Ensure the expected structure exists
      if (!roadmapData.title || !roadmapData.topics || !Array.isArray(roadmapData.topics)) {
        console.error("Invalid roadmap data structure:", roadmapData);
        throw new Error("The generated roadmap doesn't have the expected structure");
      }
      
      // Fix day numbers if needed
      if (roadmapData.topics.length > 0) {
        roadmapData.topics = roadmapData.topics.map((topic, index) => ({
          ...topic,
          day: topic.day || index + 1
        }));
      }
      
      // Ensure we have the right number of days
      const actualDuration = parseInt(duration) || 30;
      if (roadmapData.topics.length < actualDuration) {
        console.log(`Topics length (${roadmapData.topics.length}) less than duration (${actualDuration}), padding...`);
        // Add more days if we have fewer than requested
        for (let i = roadmapData.topics.length + 1; i <= actualDuration; i++) {
          roadmapData.topics.push({
            day: i,
            topic: `Day ${i}: Continue Learning`,
            content: `Continue building on your knowledge from previous days.`,
            resources: [
              {
                type: "doc",
                title: "Practice Exercises",
                url: "https://www.google.com/search?q=" + encodeURIComponent(`${goal} practice exercises`)
              }
            ]
          });
        }
      } else if (roadmapData.topics.length > actualDuration) {
        console.log(`Topics length (${roadmapData.topics.length}) more than duration (${actualDuration}), trimming...`);
        // Trim if we have more days than requested
        roadmapData.topics = roadmapData.topics.slice(0, actualDuration);
      }
      
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Raw response text:", data.candidates[0].content.parts[0].text);
      throw new Error("Failed to parse the generated roadmap data");
    }

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to generate roadmap",
        fallback: {
          title: "Learning Plan",
          topics: Array.from({ length: parseInt(req.duration) || 30 }, (_, i) => ({
            day: i + 1,
            topic: `Day ${i + 1}`,
            content: "Content will be available soon.",
            resources: []
          }))
        }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
