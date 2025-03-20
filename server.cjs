const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3002;

// Add custom routes here if needed
server.use(middlewares);

// Add middleware to enhance the server functionality
server.use(jsonServer.bodyParser);

// Custom middleware for logging
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Add custom routes before the router
server.use((req, res, next) => {
  if (req.method === "POST" && req.path === "/users") {
    // Add created date for new users
    req.body.createdAt = new Date().toISOString();
  }
  next();
});

// Use the router
server.use(router);

// Start the server
server.listen(PORT, () => {
  console.log(`JSON Server is running on port ${PORT}`);
});
