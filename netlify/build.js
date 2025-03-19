import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const sourceFile = path.resolve(__dirname, "../db.json");
const targetDir = path.resolve(__dirname, "functions");
const targetFile = path.join(targetDir, "db.json");

// Make sure the target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Check if source db.json exists
if (fs.existsSync(sourceFile)) {
  // Copy the file if it exists
  console.log("Copying existing db.json file...");
  fs.copyFileSync(sourceFile, targetFile);
  console.log("Database file copied to functions directory");
} else {
  // Create a default db.json file if the original doesn't exist
  console.log("Source db.json not found. Creating default database file...");
  const defaultDbContent = {
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

  // Write the default database file
  fs.writeFileSync(targetFile, JSON.stringify(defaultDbContent, null, 2));
  console.log("Default database file created in functions directory");
}

// Ensure function dependencies are installed
console.log("Installing function dependencies...");
try {
  execSync("npm run functions:install", { stdio: "inherit" });
  console.log("Function dependencies installed successfully");
} catch (error) {
  console.error("Error installing function dependencies:", error);
}
