
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

// Define the endpoint for Google's Gemini 2.5 Flash Preview Native Audio Dialog model
const GEMINI_ENDPOINT = "wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-native-audio-dialog:streamGenerateContent?key=";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create WebSocket connection
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    console.log("WebSocket connection established with client");

    // Initialize the Gemini API connection
    let geminiSocket: WebSocket | null = null;

    // Handle client connection
    clientSocket.onopen = () => {
      console.log("Client connected");
      
      // Connect to Gemini API
      try {
        // Connect to Gemini endpoint with API key
        geminiSocket = new WebSocket(`${GEMINI_ENDPOINT}${GEMINI_API_KEY}`);
        
        geminiSocket.onopen = () => {
          console.log("Connected to Gemini API");
          
          // Send initial session configuration to Gemini
          geminiSocket.send(JSON.stringify({
            type: "session.create",
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Alloy" } },
                languageCode: "en-US"
              }
            }
          }));
        };
        
        // Forward messages from Gemini to client
        geminiSocket.onmessage = (event) => {
          try {
            console.log(`Received message from Gemini API: ${event.data.slice(0, 100)}...`);
            clientSocket.send(event.data);
          } catch (error) {
            console.error("Error handling message from Gemini:", error);
          }
        };
        
        geminiSocket.onerror = (error) => {
          console.error("Gemini WebSocket error:", error);
          clientSocket.send(JSON.stringify({
            error: "Error connecting to Gemini API"
          }));
        };
        
        geminiSocket.onclose = (event) => {
          console.log("Gemini WebSocket closed:", event.code, event.reason);
        };
      } catch (error) {
        console.error("Failed to connect to Gemini API:", error);
        clientSocket.send(JSON.stringify({
          error: "Failed to connect to Gemini API"
        }));
      }
    };

    // Forward messages from client to Gemini
    clientSocket.onmessage = (event) => {
      try {
        if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
          console.log(`Forwarding message to Gemini API: ${event.data.slice(0, 100)}...`);
          geminiSocket.send(event.data);
        }
      } catch (error) {
        console.error("Error forwarding message to Gemini:", error);
      }
    };

    // Handle client disconnection
    clientSocket.onclose = () => {
      console.log("Client disconnected");
      
      // Close Gemini connection when client disconnects
      if (geminiSocket) {
        geminiSocket.close();
        geminiSocket = null;
      }
    };

    // Handle errors
    clientSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return response;
  } catch (error) {
    console.error("Error handling WebSocket:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
