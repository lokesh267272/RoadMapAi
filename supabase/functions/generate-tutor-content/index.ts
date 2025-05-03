
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { topicId, topicTitle } = await req.json();
    
    if (!topicTitle) {
      throw new Error("Missing topic title");
    }

    // Here you would integrate with Gemini API
    // For now, we'll generate a mock response
    const content = generateMockContent(topicTitle);

    return new Response(
      JSON.stringify({ 
        success: true,
        content
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error("Error in generate-tutor-content:", error);
    
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
function generateMockContent(topicTitle: string): string {
  const topics: Record<string, string> = {
    "Introduction to JavaScript": `
# Introduction to JavaScript

JavaScript is one of the most popular programming languages in the world and is essential for web development. It allows you to create dynamic and interactive websites.

## What is JavaScript?

JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. It was originally developed by Netscape as a means to add dynamic and interactive elements to websites.

Unlike HTML and CSS, which are primarily used for structure and styling, JavaScript enables you to:
- Respond to user actions
- Modify webpage content on-the-fly
- Fetch data from servers without reloading the page
- Build full-featured web applications

## Basic JavaScript Syntax

Here's a simple example of JavaScript code:

\`\`\`javascript
// This is a comment
let greeting = "Hello, World!";
console.log(greeting); // Outputs: Hello, World!

// A simple function
function addNumbers(a, b) {
  return a + b;
}

let sum = addNumbers(5, 3);
console.log(sum); // Outputs: 8
\`\`\`

## Key JavaScript Concepts

| Concept | Description | Example |
|---------|-------------|---------|
| Variables | Containers for storing data values | \`let name = "John";\` |
| Data Types | Different types of data (strings, numbers, etc.) | \`let age = 25;\` |
| Functions | Blocks of code designed to perform specific tasks | \`function greet() { ... }\` |
| Objects | Collections of related data and/or functionality | \`let person = { name: "Jane", age: 30 };\` |
| Arrays | Ordered collections of items | \`let fruits = ["apple", "banana"];\` |

## Why Learn JavaScript?

1. **Versatility** - Works on front-end and back-end (Node.js)
2. **High demand** - One of the most sought-after skills in tech
3. **Large ecosystem** - Countless libraries and frameworks
4. **Community support** - Extensive documentation and resources

## Getting Started

To start coding in JavaScript, all you need is a web browser and a text editor. You can write JavaScript directly in your browser's developer console or embed it in an HTML file.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <title>My First JavaScript</title>
</head>
<body>
  <h1>Hello JavaScript!</h1>
  
  <script>
    // Your JavaScript code goes here
    alert("Welcome to JavaScript!");
  </script>
</body>
</html>
\`\`\`
    `,
    "Variables and Data Types": `
# Variables and Data Types in JavaScript

Variables are containers for storing data values. In JavaScript, understanding variables and data types is fundamental to writing effective code.

## Declaring Variables

JavaScript offers three ways to declare variables:

\`\`\`javascript
// Using var (older way, function scoped)
var name = "John";

// Using let (block scoped, can be reassigned)
let age = 25;

// Using const (block scoped, cannot be reassigned)
const PI = 3.14159;
\`\`\`

## JavaScript Data Types

JavaScript has several built-in data types:

| Data Type | Description | Example |
|-----------|-------------|---------|
| String | Textual data | \`let name = "JavaScript";\` |
| Number | Integers or floating-point numbers | \`let age = 25; let price = 19.99;\` |
| Boolean | Logical values (true/false) | \`let isActive = true;\` |
| Undefined | Variable declared but not assigned a value | \`let result;\` |
| Null | Intentional absence of any object value | \`let empty = null;\` |
| Object | Collection of key-value pairs | \`let person = { name: "Alice", age: 30 };\` |
| Array | Ordered collection of values | \`let colors = ["red", "green", "blue"];\` |
| Function | Reusable block of code | \`function add(a, b) { return a + b; }\` |

## Type Coercion and Conversion

JavaScript is a dynamically typed language, which means variables can change types:

\`\`\`javascript
let value = 42;      // value is a number
value = "42";        // value is now a string

// Type coercion
console.log("5" + 3);  // Outputs: "53" (number is coerced to string)
console.log("5" - 3);  // Outputs: 2 (string is coerced to number)

// Explicit type conversion
console.log(Number("5") + 3);  // Outputs: 8
console.log(String(5) + 3);    // Outputs: "53"
\`\`\`

## Variable Scope

Scope determines the accessibility of variables:

\`\`\`javascript
// Global scope
let globalVar = "I am global";

function exampleFunction() {
  // Function scope
  let functionVar = "I am function-scoped";
  
  if (true) {
    // Block scope
    let blockVar = "I am block-scoped";
    var notBlockVar = "I am not block-scoped";
    
    console.log(globalVar);     // Accessible
    console.log(functionVar);   // Accessible
    console.log(blockVar);      // Accessible
  }
  
  console.log(notBlockVar);     // Accessible (var is function-scoped)
  console.log(blockVar);        // Error! blockVar is not defined here
}
\`\`\`

## Best Practices for Variables

1. **Use descriptive names** - Choose names that describe what the variable represents
2. **Use camelCase** - Start with lowercase, capitalize subsequent words (e.g., firstName)
3. **Prefer const** - Use const by default, and only use let when you know the value will change
4. **Avoid var** - It has confusing scoping rules compared to let and const
5. **Declare at the top** - Declare variables at the top of their scope for better readability
    `,
    "Control Flow": `
# Control Flow in JavaScript

Control flow is how we direct the execution path of our program based on conditions and loops.

## Conditional Statements

Conditional statements allow your code to make decisions and execute different code blocks based on different conditions.

### if...else Statement

\`\`\`javascript
let temperature = 75;

if (temperature > 80) {
  console.log("It's hot outside!");
} else if (temperature > 60) {
  console.log("It's a nice day!");
} else {
  console.log("It's cold outside!");
}
// Outputs: "It's a nice day!"
\`\`\`

### switch Statement

\`\`\`javascript
let day = "Monday";

switch (day) {
  case "Monday":
    console.log("Start of the work week.");
    break;
  case "Friday":
    console.log("End of the work week!");
    break;
  case "Saturday":
  case "Sunday":
    console.log("Weekend!");
    break;
  default:
    console.log("Midweek.");
    break;
}
// Outputs: "Start of the work week."
\`\`\`

### Ternary Operator

\`\`\`javascript
let age = 20;
let canVote = age >= 18 ? "Yes" : "No";
console.log(canVote); // Outputs: "Yes"
\`\`\`

## Comparison and Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| == | Equal value | \`5 == "5"  // true\` |
| === | Equal value and type | \`5 === "5"  // false\` |
| != | Not equal value | \`5 != "6"  // true\` |
| !== | Not equal value or type | \`5 !== "5"  // true\` |
| > | Greater than | \`10 > 5  // true\` |
| < | Less than | \`10 < 5  // false\` |
| >= | Greater than or equal to | \`10 >= 10  // true\` |
| <= | Less than or equal to | \`5 <= 5  // true\` |
| && | Logical AND | \`(x > 0) && (y < 10)  // true if both are true\` |
| \|\| | Logical OR | \`(x > 0) \|\| (y < 0)  // true if either is true\` |
| ! | Logical NOT | \`!(x > 0)  // true if x <= 0\` |

## Loops

Loops are used to repeat a block of code until a specific condition is met.

### for Loop

\`\`\`javascript
for (let i = 0; i < 5; i++) {
  console.log(i);
}
// Outputs: 0, 1, 2, 3, 4
\`\`\`

### while Loop

\`\`\`javascript
let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}
// Outputs: 0, 1, 2, 3, 4
\`\`\`

### do...while Loop

\`\`\`javascript
let i = 0;
do {
  console.log(i);
  i++;
} while (i < 5);
// Outputs: 0, 1, 2, 3, 4
\`\`\`

### for...of Loop (Iterating Arrays)

\`\`\`javascript
const fruits = ["apple", "banana", "orange"];
for (const fruit of fruits) {
  console.log(fruit);
}
// Outputs: "apple", "banana", "orange"
\`\`\`

### for...in Loop (Iterating Objects)

\`\`\`javascript
const person = { name: "John", age: 30, job: "developer" };
for (const key in person) {
  console.log(key + ": " + person[key]);
}
// Outputs: "name: John", "age: 30", "job: developer"
\`\`\`

## Break and Continue

The break statement exits a loop early, while the continue statement skips the current iteration.

\`\`\`javascript
for (let i = 0; i < 10; i++) {
  if (i === 3) {
    continue; // Skip the rest of this iteration
  }
  if (i === 7) {
    break; // Exit the loop entirely
  }
  console.log(i);
}
// Outputs: 0, 1, 2, 4, 5, 6
\`\`\`
    `
  };
  
  // Return the content for the specific topic, or a general content if not found
  return topics[topicTitle] || `
# ${topicTitle}

This is an automatically generated tutorial on ${topicTitle}.

## Overview

${topicTitle} is an important concept in programming and software development. It helps developers build more efficient, maintainable, and scalable applications.

## Key Concepts

Here are some key concepts related to ${topicTitle}:

| Concept | Description |
|---------|-------------|
| Fundamentals | The core principles of ${topicTitle} |
| Advanced Topics | More complex aspects of ${topicTitle} |
| Best Practices | Recommended approaches when working with ${topicTitle} |

## Example Code

\`\`\`javascript
// This is a simple example related to ${topicTitle}
function example() {
  console.log("Learning about ${topicTitle}");
}

example();
\`\`\`

## Why ${topicTitle} Matters

Understanding ${topicTitle} is important because:
1. It helps you write better code
2. It improves application performance
3. It's commonly used in modern development

## Next Steps

After mastering ${topicTitle}, you might want to explore related topics and apply your knowledge in practical projects.
  `;
}
