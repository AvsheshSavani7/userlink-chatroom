const jsonServer = require("json-server");
const serverless = require("serverless-http");
const path = require("path");
const fs = require("fs");

// Get an absolute path to the JSON file
const dbPath = path.join(__dirname, "../../db.json");
let dbData;

try {
  dbData = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  console.log("Successfully loaded database");
} catch (error) {
  console.error("Error loading database:", error);
  dbData = { users: [], messages: [], rooms: [] }; // Default data
}

// Create Express server
const server = jsonServer.create();

// Use the router for the database
const router = jsonServer.router(dbData);

// Define default middlewares (logger, static, cors, etc)
const middlewares = jsonServer.defaults({
  readOnly: false
});

// Custom routes or middlewares
server.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === "POST" && req.path === "/users") {
    // Add created date for new users
    req.body.createdAt = new Date().toISOString();
  }
  next();
});

// Use the middlewares
server.use(middlewares);

// Mount the router on /api
server.use("/api", router);

// For all other routes, redirect to the API
server.use("/", (req, res) => {
  res.redirect("/api");
});

// Export the serverless function
module.exports = { handler: serverless(server) };
