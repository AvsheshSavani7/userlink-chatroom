// Simple test script to verify our Netlify function
import { createServer } from "http";
import { exec } from "child_process";

// Import the function handler
import { handler } from "./functions/api.cjs";

console.log("Starting test server for Netlify function.");

// Define a simple test server to handle the request
const server = createServer(async (req, res) => {
  // Create a mock event object
  const event = {
    path: req.url,
    httpMethod: req.method,
    headers: req.headers,
    body: null
  };

  // Create a mock context object
  const context = {};

  try {
    // Call the function handler with the mock event and context
    const result = await handler(event, context);

    // Set the status code
    res.statusCode = result.statusCode;

    // Set the headers
    Object.entries(result.headers || {}).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    // Send the response
    res.end(result.body);
  } catch (error) {
    console.error("Error calling function:", error);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

// Start the server
const PORT = 9000;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log("Opening browser...");

  // Open the browser
  exec(`open http://localhost:${PORT}/api`);
});
