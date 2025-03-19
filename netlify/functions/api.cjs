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
    console.log("Database file not found, using empty collections");
    // Initialize with empty collections instead of demo data
    db = {
      users: [],
      assistants: [],
      files: [],
      chat_threads: [],
      messages: []
    };
  }
} catch (error) {
  console.error("Error loading database:", error);
  db = {
    users: [],
    assistants: [],
    files: [],
    chat_threads: [],
    messages: []
  };
}

// API routes
app.get("/api", (req, res) => {
  res.json({
    message: "API is working",
    endpoints: ["/api/users", "/api/assistants", "/api/files", "/api/messages"]
  });
});

// GET all items
app.get("/api/:resource", (req, res) => {
  const { resource } = req.params;
  if (!db[resource]) {
    return res.status(404).json({ error: `Resource "${resource}" not found` });
  }

  // Handle query parameters for filtering
  const queryParams = req.query;
  if (Object.keys(queryParams).length > 0) {
    const filtered = db[resource].filter((item) => {
      return Object.entries(queryParams).every(([key, value]) => {
        return item[key] === value;
      });
    });
    return res.json(filtered);
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
    // Only add id if not provided
    id: req.body.id || String(Date.now()),
    // Only add createdAt if not provided
    createdAt: req.body.createdAt || new Date().toISOString()
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

// PATCH update item (partial)
app.patch("/api/:resource/:id", (req, res) => {
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
