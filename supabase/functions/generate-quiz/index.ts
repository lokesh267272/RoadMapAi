
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Helper function to get allowed origin
function getAllowedOrigin(requestOrigin: string | null): string {
  const allowedOrigins = [
    "https://studytheskill.com", 
    "https://preview--roadmapai.lovable.app", 
    "https://roadmapai.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173"
  ];
  
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // Default fallback
  return "https://preview--roadmapai.lovable.app";
}

serve(async (req) => {
  // Get dynamic origin based on request
  const requestOrigin = req.headers.get("origin");
  const allowedOrigin = getAllowedOrigin(requestOrigin);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { topic, topicId, roadmapId } = await req.json();
    console.log(`Received request to generate quiz for topic: ${topic}, ID: ${topicId}, roadmapId: ${roadmapId}`);

    if (!topic) {
      throw new Error('Missing required parameter: topic');
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error('API configuration error - please contact administrator');
    }

    const prompt = `
      Create a quiz with 5 multiple-choice questions about the topic: "${topic}".
      
      Each question should have 4 possible answers, with only one correct answer.
      
      Structure your response strictly as a valid JSON object with the following format:
      {
        "topic": "${topic}",
        "questions": [
          {
            "question": "Question text here?",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correct_answer": "Option 2"
          },
          ...and so on for all 5 questions
        ]
      }
      
      Ensure that:
      1. The correct_answer is exactly the same string as one of the options
      2. Questions test different aspects of the topic
      3. Questions have varying difficulty
      4. Questions are clear and unambiguous
      5. The JSON is valid and follows the exact structure shown above
      
      Do not include any explanations, markdown, or text outside of the JSON structure.
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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096,
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

    // Extract the JSON string from the response
    let quizData;
    try {
      const textContent = data.candidates[0].content.parts[0].text;
      // Try to extract JSON if wrapped in backticks or other markdown
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, textContent];
      
      const jsonStr = jsonMatch[1].trim();
      quizData = JSON.parse(jsonStr);
      
      console.log("Successfully parsed quiz data");
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      throw new Error("Failed to parse the generated quiz data");
    }

    return new Response(JSON.stringify({ quiz: quizData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in generate-quiz function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate quiz" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
