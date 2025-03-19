
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { FileInfo } from '../types/file';

// Initialize OpenAI client with API key from environment variable or local storage
const getApiKey = () => {
  return import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem('openai_api_key') || '';
};

const openai = new OpenAI({
  apiKey: getApiKey(),
  dangerouslyAllowBrowser: true,
});

// Local storage keys
const VECTORS_KEY_PREFIX = 'openai_vectors_';
const ASSISTANTS_KEY_PREFIX = 'openai_assistants_';
const API_KEY = 'openai_api_key';

// Interfaces
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface VectorDocument {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  vectorIds: string[];
  userId: string;
  createdAt: Date;
}

export interface ChatHistory {
  userId: string;
  messages: ChatMessage[];
  lastUpdated: Date;
}

export interface UserAssistant {
  id: string;
  assistantId: string;
  name: string;
  description: string;
  threadId: string | null;
  userId: string;
  createdAt: Date;
}

// Functions to manage OpenAI API key
export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY, key);
  openai.apiKey = key;
  return isApiKeySet();
};

export const isApiKeySet = () => {
  return !!getApiKey();
};

// Function to create vector embeddings from file content
export const createVectorEmbeddings = async (
  fileContent: string,
  fileName: string,
  fileId: string,
  fileSize: number,
  fileType: string,
  userId: string
): Promise<boolean> => {
  try {
    if (!isApiKeySet()) {
      throw new Error('OpenAI API key is not set');
    }

    // Split content into chunks
    const chunks = splitIntoChunks(fileContent, 1000);
    const vectorIds: string[] = [];

    // Create embeddings for each chunk
    for (const chunk of chunks) {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float",
      });

      const vectorId = uuidv4();
      const vector = {
        id: vectorId,
        values: embeddingResponse.data[0].embedding,
        text: chunk,
      };

      // Store vector in local storage
      const vectors = getVectorsForUser(userId) || [];
      vectors.push(vector);
      saveVectorsForUser(userId, vectors);
      vectorIds.push(vectorId);
    }

    // Save document metadata
    const vectorDocuments = getVectorDocuments(userId) || [];
    vectorDocuments.push({
      fileId,
      fileName,
      fileSize,
      fileType,
      vectorIds,
      userId,
      createdAt: new Date(),
    });
    saveVectorDocuments(userId, vectorDocuments);

    return true;
  } catch (error) {
    console.error('Error creating vector embeddings:', error);
    return false;
  }
};

// Functions to manage user-specific OpenAI assistants
export const createUserAssistant = async (
  name: string,
  description: string,
  userId: string
): Promise<UserAssistant | null> => {
  try {
    if (!isApiKeySet()) {
      throw new Error('OpenAI API key is not set');
    }

    // Create OpenAI assistant
    const assistant = await openai.beta.assistants.create({
      name,
      instructions: description,
      model: "gpt-3.5-turbo",
      tools: [{ type: "retrieval" }],
    });

    // Create thread for the assistant
    const thread = await openai.beta.threads.create();

    // Save assistant metadata
    const userAssistant: UserAssistant = {
      id: uuidv4(),
      assistantId: assistant.id,
      name,
      description,
      threadId: thread.id,
      userId,
      createdAt: new Date(),
    };

    const userAssistants = getUserAssistants(userId) || [];
    userAssistants.push(userAssistant);
    saveUserAssistants(userId, userAssistants);

    return userAssistant;
  } catch (error) {
    console.error('Error creating user assistant:', error);
    return null;
  }
};

export const getUserAssistants = (userId: string): UserAssistant[] | null => {
  const assistants = localStorage.getItem(`${ASSISTANTS_KEY_PREFIX}${userId}`);
  return assistants ? JSON.parse(assistants) : null;
};

export const saveUserAssistants = (userId: string, assistants: UserAssistant[]) => {
  localStorage.setItem(`${ASSISTANTS_KEY_PREFIX}${userId}`, JSON.stringify(assistants));
};

export const sendMessageToAssistant = async (
  message: string,
  userAssistantId: string,
  userId: string
): Promise<string> => {
  try {
    if (!isApiKeySet()) {
      throw new Error('OpenAI API key is not set');
    }

    // Get user assistant
    const userAssistants = getUserAssistants(userId) || [];
    const userAssistant = userAssistants.find(a => a.id === userAssistantId);
    
    if (!userAssistant) {
      throw new Error('Assistant not found');
    }

    if (!userAssistant.threadId) {
      // Create thread if it doesn't exist
      const thread = await openai.beta.threads.create();
      userAssistant.threadId = thread.id;
      saveUserAssistants(userId, userAssistants);
    }

    // Add message to thread
    await openai.beta.threads.messages.create(userAssistant.threadId!, {
      role: "user",
      content: message,
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(userAssistant.threadId!, {
      assistant_id: userAssistant.assistantId,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(
      userAssistant.threadId!,
      run.id
    );

    // Poll for completion (in a real app, you might want to use a more sophisticated approach)
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        userAssistant.threadId!,
        run.id
      );
    }

    if (runStatus.status === "failed") {
      throw new Error("Assistant run failed");
    }

    // Get messages from thread
    const messages = await openai.beta.threads.messages.list(userAssistant.threadId!);
    
    // Return the last assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    if (assistantMessages.length === 0) {
      return "No response from assistant.";
    }
    
    // Get the content of the latest message
    const latestMessage = assistantMessages[0];
    if (typeof latestMessage.content[0] === 'object' && 'text' in latestMessage.content[0]) {
      return latestMessage.content[0].text.value;
    }
    
    return "Couldn't parse assistant response.";
  } catch (error) {
    console.error('Error sending message to assistant:', error);
    return "Error communicating with the assistant.";
  }
};

// Function to get relevant context based on user query
export const getRelevantContext = async (query: string, userId: string): Promise<string> => {
  try {
    if (!isApiKeySet()) {
      throw new Error('OpenAI API key is not set');
    }

    // Create embedding for query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float",
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Get vectors for user
    const vectors = getVectorsForUser(userId) || [];
    if (vectors.length === 0) {
      return '';
    }

    // Find most similar vectors
    const similarities = vectors.map(vector => ({
      id: vector.id,
      text: vector.text,
      similarity: cosineSimilarity(queryEmbedding, vector.values),
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Take top 3 most relevant chunks
    const topResults = similarities.slice(0, 3);
    return topResults.map(result => result.text).join('\n\n');
  } catch (error) {
    console.error('Error getting relevant context:', error);
    return '';
  }
};

// Function to generate response from OpenAI
export const generateChatResponse = async (
  messages: ChatMessage[],
  query: string,
  userId: string
): Promise<string> => {
  try {
    if (!isApiKeySet()) {
      throw new Error('OpenAI API key is not set');
    }

    // Get relevant context from vector store
    const relevantContext = await getRelevantContext(query, userId);

    // Format messages for OpenAI
    const systemMessage = {
      role: "system" as const,
      content: `You are a helpful assistant that answers questions based on the user's documents. 
      Use the following information from the user's documents to provide accurate answers:
      ${relevantContext || 'No relevant documents found. Answer based on your general knowledge.'}`
    };

    const formattedMessages = messages
      .slice(-10) // Only use last 10 messages for context
      .map(msg => ({
        role: msg.isUser ? "user" as const : "assistant" as const,
        content: msg.content
      }));

    // Add the current query
    formattedMessages.push({
      role: "user" as const,
      content: query
    });

    // Call OpenAI chat completion
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [systemMessage, ...formattedMessages],
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating chat response:', error);
    return "Sorry, I encountered an error while generating a response.";
  }
};

// Helper functions for local storage
export const getVectorsForUser = (userId: string) => {
  const vectors = localStorage.getItem(`${VECTORS_KEY_PREFIX}${userId}`);
  return vectors ? JSON.parse(vectors) : null;
};

export const saveVectorsForUser = (userId: string, vectors: any[]) => {
  localStorage.setItem(`${VECTORS_KEY_PREFIX}${userId}`, JSON.stringify(vectors));
};

export const getVectorDocuments = (userId: string): VectorDocument[] | null => {
  const docs = localStorage.getItem(`vector_documents_${userId}`);
  return docs ? JSON.parse(docs) : null;
};

export const saveVectorDocuments = (userId: string, documents: VectorDocument[]) => {
  localStorage.setItem(`vector_documents_${userId}`, JSON.stringify(documents));
};

// Function to save chat history
export const saveChatHistory = (userId: string, messages: ChatMessage[]) => {
  const history: ChatHistory = {
    userId,
    messages,
    lastUpdated: new Date(),
  };
  localStorage.setItem(`chat_history_${userId}`, JSON.stringify(history));
};

// Function to get chat history
export const getChatHistory = (userId: string): ChatMessage[] => {
  const history = localStorage.getItem(`chat_history_${userId}`);
  if (!history) return [];
  
  const parsed: ChatHistory = JSON.parse(history);
  return parsed.messages.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
  }));
};

// Helper utilities
const splitIntoChunks = (text: string, chunkSize: number): string[] => {
  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};
