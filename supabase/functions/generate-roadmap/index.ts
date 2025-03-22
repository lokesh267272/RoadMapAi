
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
        "title": "A descriptive title for the roadmap",
        "topics": [
          {
            "day": 1,
            "topic": "Topic title for day 1",
            "content": "Detailed description of what to learn on day 1"
          },
          {
            "day": 2,
            "topic": "Topic title for day 2",
            "content": "Detailed description of what to learn on day 2"
          },
          ...and so on for each day
        ]
      }
      
      Do not include any explanations, markdown, or text outside of the JSON structure.
      Ensure each day has a clear learning objective that builds on previous days.
      The roadmap should be comprehensive, practical, and follow a logical progression.
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

    // Extract the JSON string from the response
    let roadmapData;
    try {
      const textContent = data.candidates[0].content.parts[0].text;
      // Try to extract JSON if wrapped in backticks or other markdown
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                         [null, textContent];
      
      const jsonStr = jsonMatch[1].trim();
      roadmapData = JSON.parse(jsonStr);
      
      console.log("Successfully parsed roadmap data");
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      throw new Error("Failed to parse the generated roadmap data");
    }

    return new Response(JSON.stringify({ roadmap: roadmapData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in generate-roadmap function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate roadmap" }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
