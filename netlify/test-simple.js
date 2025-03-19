// Simple script to test the Netlify function
import http from "http";
import { exec } from "child_process";

console.log("Testing the Netlify function locally...");

// Create a simple server to test the function
const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);

  if (req.url.startsWith("/api")) {
    // Simulate an API request
    const data = {
      message: "API is working!",
      endpoints: ["/api/users", "/api/messages", "/api/rooms"]
    };

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } else {
    // Redirect to API
    res.writeHead(302, { Location: "/api" });
    res.end();
  }
});

// Start the server
const PORT = 9000;
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log("Try visiting /api to see if it works");

  // Open the browser
  exec(`open http://localhost:${PORT}/api`);
});
