
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicId, topicTitle, message, history } = await req.json();
    
    if (!topicTitle || !message) {
      throw new Error("Missing required parameters");
    }

    // Here you would integrate with Gemini API
    // For now, we'll generate a mock response
    const response = generateMockResponse(topicTitle, message, history);

    return new Response(
      JSON.stringify({ 
        success: true,
        response
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-tutor-response:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// This is a placeholder function until you integrate with Gemini API
function generateMockResponse(topicTitle: string, userMessage: string, history: Message[]): string {
  const lowerCaseMessage = userMessage.toLowerCase();
  
  // Check for question types and provide relevant responses
  if (lowerCaseMessage.includes("what is") || lowerCaseMessage.includes("explain")) {
    return `${topicTitle} is a fundamental concept in programming. It involves understanding how code executes and manipulates data.

Let me explain the key points:
1. It helps organize your code logically
2. It improves readability and maintainability
3. It allows for better error handling

Would you like me to go deeper on any specific aspect?`;
  }
  
  if (lowerCaseMessage.includes("example") || lowerCaseMessage.includes("code")) {
    return `Here's a practical example related to ${topicTitle}:

\`\`\`javascript
function demonstrateExample() {
  // This is a sample implementation
  const data = fetchData();
  const processed = processData(data);
  return displayResults(processed);
}

// Helper functions
function fetchData() {
  return ["item1", "item2", "item3"];
}

function processData(items) {
  return items.map(item => item.toUpperCase());
}

function displayResults(results) {
  console.log("Processed results:", results);
  return results;
}

// Execute the function
demonstrateExample();
\`\`\`

This example shows how to structure code using functions with single responsibilities. Each function does one thing well, making the code more maintainable.`;
  }
  
  if (lowerCaseMessage.includes("best practice") || lowerCaseMessage.includes("tip")) {
    return `Here are some best practices for ${topicTitle}:

| Practice | Description | Benefit |
|----------|-------------|---------|
| Clear Naming | Use descriptive variable and function names | Improves code readability |
| Consistent Formatting | Follow a style guide for formatting | Makes code easier to maintain |
| Proper Documentation | Add comments and documentation | Helps other developers understand your code |
| Testing | Write tests for your code | Ensures code works as expected |
| Modularization | Break code into smaller, reusable modules | Improves maintainability |

Following these practices will help you write cleaner, more maintainable code.`;
  }
  
  // Default response
  return `Thanks for your question about ${topicTitle}. I'm here to help you understand this topic better.

${userMessage.includes("?") ? "Let me address your question." : "Let me explain further."} 

${topicTitle} is important because it forms the foundation of many programming concepts. Understanding it thoroughly will help you become a better developer.

Is there a specific part of ${topicTitle} you'd like me to explain in more detail?`;
}
