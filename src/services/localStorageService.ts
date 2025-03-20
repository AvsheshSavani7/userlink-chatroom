import { v4 as uuidv4 } from "uuid";

// Define types for our data model
export type User = {
  id: string;
  name: string;
  email?: string;
  createdAt: string;
  assistantId?: string;
};

export type Assistant = {
  id: string;
  userId: string;
  openaiAssistantId: string;
  name: string;
  threadId?: string;
  createdAt: string;
};

export type File = {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  openaiFileId: string;
  assistantId: string;
  createdAt: string;
};

export type Message = {
  id: string;
  threadId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
};

// Define database structure
export type Database = {
  users: User[];
  assistants: Assistant[];
  files: File[];
  chat_threads: any[]; // Not fully implemented yet
  messages: Message[];
};

// Initialize or load database from localStorage
const initDatabase = (): Database => {
  const storedDb = localStorage.getItem("chatroom_db");
  if (storedDb) {
    try {
      return JSON.parse(storedDb);
    } catch (e) {
      console.error("Error parsing stored database:", e);
    }
  }

  // Default empty database structure
  return {
    users: [],
    assistants: [],
    files: [],
    chat_threads: [],
    messages: []
  };
};

// Helper function to save database to localStorage
const saveDatabase = (db: Database): void => {
  localStorage.setItem("chatroom_db", JSON.stringify(db));
};

// Get the database (always returns a fresh copy)
export const getDatabase = (): Database => {
  return initDatabase();
};

// User-related functions
export const createUser = (name: string, email?: string): User => {
  const db = getDatabase();
  const newUser: User = {
    id: uuidv4(),
    name,
    email,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDatabase(db);
  return newUser;
};

export const getUserById = (userId: string): User | null => {
  const db = getDatabase();
  const user = db.users.find((u) => u.id === userId);
  return user || null;
};

export const updateUser = (
  userId: string,
  updates: Partial<User>
): User | null => {
  const db = getDatabase();
  const index = db.users.findIndex((u) => u.id === userId);

  if (index === -1) return null;

  db.users[index] = { ...db.users[index], ...updates };
  saveDatabase(db);
  return db.users[index];
};

export const getAllUsers = (): User[] => {
  const db = getDatabase();
  return [...db.users].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const deleteUser = (userId: string): boolean => {
  const db = getDatabase();

  // Delete the user
  db.users = db.users.filter((u) => u.id !== userId);

  // Delete related assistants
  db.assistants = db.assistants.filter((a) => a.userId !== userId);

  // Delete related files
  db.files = db.files.filter((f) => f.userId !== userId);

  // Delete related messages (based on assistants' threadIds)
  const userAssistantThreadIds = db.assistants
    .filter((a) => a.userId === userId && a.threadId)
    .map((a) => a.threadId);

  db.messages = db.messages.filter(
    (m) => !userAssistantThreadIds.includes(m.threadId)
  );

  saveDatabase(db);
  return true;
};

// Assistant-related functions
export const createAssistant = (
  userId: string,
  openaiAssistantId: string,
  name: string,
  threadId?: string
): Assistant => {
  const db = getDatabase();

  const newAssistant: Assistant = {
    id: uuidv4(),
    userId,
    openaiAssistantId,
    name,
    threadId,
    createdAt: new Date().toISOString()
  };

  db.assistants.push(newAssistant);

  // Update user with assistantId reference
  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex].assistantId = newAssistant.id;
  }

  saveDatabase(db);
  return newAssistant;
};

export const getAssistantsByUserId = (userId: string): Assistant[] => {
  const db = getDatabase();
  return db.assistants.filter((a) => a.userId === userId);
};

export const updateAssistant = (
  assistantId: string,
  updates: Partial<Assistant>
): Assistant | null => {
  const db = getDatabase();
  const index = db.assistants.findIndex((a) => a.id === assistantId);

  if (index === -1) return null;

  db.assistants[index] = { ...db.assistants[index], ...updates };
  saveDatabase(db);
  return db.assistants[index];
};

// File-related functions
export const createFile = (
  userId: string,
  assistantId: string,
  name: string,
  size: number,
  type: string,
  openaiFileId: string
): File => {
  const db = getDatabase();

  const newFile: File = {
    id: uuidv4(),
    userId,
    name,
    size,
    type,
    openaiFileId,
    assistantId,
    createdAt: new Date().toISOString()
  };

  db.files.push(newFile);
  saveDatabase(db);
  return newFile;
};

export const getFilesByUserId = (userId: string): File[] => {
  const db = getDatabase();
  return db.files.filter((f) => f.userId === userId);
};

export const deleteFile = (fileId: string): boolean => {
  const db = getDatabase();
  db.files = db.files.filter((f) => f.id !== fileId);
  saveDatabase(db);
  return true;
};

// Message-related functions
export const createMessage = (
  threadId: string,
  content: string,
  role: "user" | "assistant"
): Message => {
  const db = getDatabase();

  const newMessage: Message = {
    id: uuidv4(),
    threadId,
    content,
    role,
    createdAt: new Date().toISOString()
  };

  db.messages.push(newMessage);
  saveDatabase(db);
  return newMessage;
};

export const getMessagesByThreadId = (threadId: string): Message[] => {
  const db = getDatabase();
  return db.messages
    .filter((m) => m.threadId === threadId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
};
