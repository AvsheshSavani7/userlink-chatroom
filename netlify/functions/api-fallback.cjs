const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Create Express server
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());

// Load database file or create default data
let db;
try {
  const dbPath = path.join(__dirname, "db.json");
  if (fs.existsSync(dbPath)) {
    const rawData = fs.readFileSync(dbPath, "utf8");
    db = JSON.parse(rawData);
    console.log("Database loaded from file");
  } else {
    console.log("Database file not found, using default data");
    db = {
      users: [
        {
          id: "1",
          name: "Demo User",
          email: "demo@example.com",
          createdAt: new Date().toISOString()
        }
      ],
      messages: [
        {
          id: "1",
          content: "Welcome to the chat app!",
          userId: "1",
          roomId: "1",
          createdAt: new Date().toISOString()
        }
      ],
      rooms: [
        {
          id: "1",
          name: "General",
          description: "General discussion",
          createdAt: new Date().toISOString()
        }
      ]
    };
  }
} catch (error) {
  console.error("Error loading database:", error);
  db = { users: [], messages: [], rooms: [] };
}

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "API is working",
    endpoints: ["/api/users", "/api/messages", "/api/rooms"]
  });
});

// GET all items
app.get("/api/:resource", (req, res) => {
  const { resource } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }
  return res.json(db[resource]);
});

// GET single item
app.get("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }

  const item = db[resource].find((item) => item.id === id);
  if (!item) {
    return res.status(404).json({ error: `Item with ID "${id}" not found` });
  }

  return res.json(item);
});

// POST new item
app.post("/api/:resource", (req, res) => {
  const { resource } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }

  const newItem = {
    ...req.body,
    id: String(Date.now()),
    createdAt: new Date().toISOString()
  };

  db[resource].push(newItem);
  return res.status(201).json(newItem);
});

// PUT update item
app.put("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }

  const index = db[resource].findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Item with ID "${id}" not found` });
  }

  db[resource][index] = { ...db[resource][index], ...req.body };
  return res.json(db[resource][index]);
});

// DELETE item
app.delete("/api/:resource/:id", (req, res) => {
  const { resource, id } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }

  const index = db[resource].findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).json({ error: `Item with ID "${id}" not found` });
  }

  const deletedItem = db[resource][index];
  db[resource].splice(index, 1);
  return res.json(deletedItem);
});

// Fallback route
app.use("*", (req, res) => {
  res.redirect("/api");
});

// Export the serverless function
module.exports = { handler: serverless(app) };
