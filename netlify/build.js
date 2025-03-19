import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Copy the database file to the functions directory
const sourceFile = path.resolve(__dirname, "../db.json");
const targetDir = path.resolve(__dirname, "functions");

// Make sure the target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy the file
fs.copyFileSync(sourceFile, path.join(targetDir, "db.json"));
console.log("Database file copied to functions directory");
