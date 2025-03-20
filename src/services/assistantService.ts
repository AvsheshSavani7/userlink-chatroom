import { OpenAI } from "openai";
import { v4 as uuidv4 } from "uuid";

// API base URL - Priority:
// 1. Environment variable
// 2. Render deployment URL (if using Render)
// 3. Local development server
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_RENDER_API_URL ||
  "http://localhost:3002";

// Initialize OpenAI client with API key from environment variable or .env
const getApiKey = () => {
  return import.meta.env.VITE_OPENAI_API_KEY || "";
};

// Create OpenAI client
const createOpenAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Only for frontend development, not for production
    defaultHeaders: {
      "OpenAI-Beta": "assistants=v2"
    }
  });
};

// Alternative explicit API client creation with headers
const createOpenAIRequest = async (
  endpoint: string,
  method: string = "GET",
  data?: Record<string, unknown>
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key is not set");
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
  };

  const url = `https://api.openai.com/v1/${endpoint}`;

  const options: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json();
    console.error("OpenAI API Error:", errorData);
    throw new Error(
      `OpenAI API error: ${errorData.error?.message || "Unknown error"}`
    );
  }

  return response.json();
};

// Interfaces
export interface User {
  id: string;
  name: string;
  createdAt: string;
  assistantId?: string;
}

export interface Assistant {
  id: string;
  userId: string;
  openaiAssistantId: string;
  name: string;
  threadId?: string;
  createdAt: string;
}

export interface File {
  id: string;
  userId: string;
  name: string;
  size: number;
  type: string;
  openaiFileId: string;
  assistantId: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  userId: string;
  assistantId: string;
  openaiThreadId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
}

// Define OpenAI response types for better type safety
interface OpenAIMessage {
  id: string;
  role: "user" | "assistant";
  content: Array<{ type: string; text?: { value: string } }>;
}

interface OpenAIListResponse<T> {
  data: T[];
  object: string;
  first_id: string;
  last_id: string;
  has_more: boolean;
}

// Create a new user and an associated OpenAI assistant
export const createUserWithAssistant = async (name: string): Promise<User> => {
  try {
    // Create a user
    const userResponse = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString()
      })
    });

    const user = await userResponse.json();

    // Create an OpenAI assistant using direct API call with v2 header
    const assistant = await createOpenAIRequest("assistants", "POST", {
      name: `${name}'s Assistant`,
      instructions: `You are a personal assistant for ${name}. Use the knowledge from attached files to provide accurate and helpful responses.`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }]
    });

    // Create a thread using direct API call with v2 header
    const thread = await createOpenAIRequest("threads", "POST");

    // Save the assistant record in our JSON server
    const assistantResponse = await fetch(`${API_BASE_URL}/assistants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: uuidv4(),
        userId: user.id,
        openaiAssistantId: assistant.id,
        name: `${name}'s Assistant`,
        threadId: thread.id,
        createdAt: new Date().toISOString()
      })
    });

    const assistantData = await assistantResponse.json();

    // Update user with assistantId
    const updatedUserResponse = await fetch(
      `${API_BASE_URL}/users/${user.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          assistantId: assistantData.id
        })
      }
    );

    return await updatedUserResponse.json();
  } catch (error) {
    console.error("Error creating tenant with assistant:", error);
    throw error;
  }
};

// Upload a file and attach it to the user's assistant
export const uploadFileToAssistant = async (
  userId: string,
  file: File,
  fileContent: string
): Promise<File> => {
  try {
    // Get user data
    const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
    const user = await userResponse.json();

    if (!user) {
      throw new Error("User not found");
    }

    // Get assistant data
    const assistantResponse = await fetch(
      `${API_BASE_URL}/assistants?userId=${userId}`
    );
    const assistants = await assistantResponse.json();

    if (!assistants || assistants.length === 0) {
      throw new Error("Assistant not found for this user");
    }

    const assistant = assistants[0];

    // We need to use FormData for file uploads
    const formData = new FormData();

    // Create a temporary file with the content
    const tempFile = new File([fileContent], file.name, { type: file.type });
    formData.append("file", tempFile);
    formData.append("purpose", "assistants");

    // Upload the file using direct API call
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OpenAI API key is not set");
    }

    // Upload file to OpenAI
    const fileUploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2"
      },
      body: formData
    });

    if (!fileUploadResponse.ok) {
      const errorData = await fileUploadResponse.json();
      throw new Error(
        `File upload error: ${errorData.error?.message || "Unknown error"}`
      );
    }

    const uploadedFile = await fileUploadResponse.json();

    // Make sure the assistant has the file_search tool
    await createOpenAIRequest(
      `assistants/${assistant.openaiAssistantId}`,
      "POST",
      {
        tools: [{ type: "file_search" }]
      }
    );

    // If there's no thread yet, create one
    let threadId = assistant.threadId;
    if (!threadId) {
      const thread = await createOpenAIRequest("threads", "POST");
      threadId = thread.id;

      // Update assistant with the new thread ID
      await fetch(`${API_BASE_URL}/assistants/${assistant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          threadId: thread.id
        })
      });
    }

    // Add the file as a message attachment to the thread
    await createOpenAIRequest(`threads/${threadId}/messages`, "POST", {
      role: "user",
      content: `I'm uploading ${file.name} for future reference.`,
      attachments: [
        {
          file_id: uploadedFile.id,
          tools: [{ type: "file_search" }]
        }
      ]
    });

    // Save file information to our database
    const fileResponse = await fetch(`${API_BASE_URL}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: uuidv4(),
        userId,
        name: file.name,
        size: file.size,
        type: file.type,
        openaiFileId: uploadedFile.id,
        assistantId: assistant.id,
        createdAt: new Date().toISOString()
      })
    });

    return await fileResponse.json();
  } catch (error) {
    console.error("Error uploading file to assistant:", error);
    throw error;
  }
};

// Get a list of files for a user
export const getUserFiles = async (userId: string): Promise<File[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/files?userId=${userId}`);
    return await response.json();
  } catch (error) {
    console.error("Error getting user files:", error);
    return [];
  }
};

// Ask a question to the assistant
export const askQuestion = async (
  userId: string,
  question: string
): Promise<Message> => {
  try {
    // Get user data
    const userResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
    const user = await userResponse.json();

    if (!user) {
      throw new Error("Tenant not found");
    }

    // Get assistant data
    const assistantResponse = await fetch(
      `${API_BASE_URL}/assistants?userId=${userId}`
    );
    const assistants = await assistantResponse.json();

    if (!assistants || assistants.length === 0) {
      throw new Error("Assistant not found for this user");
    }

    const assistant = assistants[0];

    let threadId = assistant.threadId;

    // If there's no thread ID, create a new thread
    if (!threadId) {
      const thread = await createOpenAIRequest("threads", "POST");
      threadId = thread.id;

      // Update assistant with the new thread ID
      await fetch(`${API_BASE_URL}/assistants/${assistant.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          threadId: thread.id
        })
      });
    }

    // Save the user message to our database
    const userMessageResponse = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: uuidv4(),
        threadId,
        content: question,
        role: "user",
        createdAt: new Date().toISOString()
      })
    });

    const userMessage = await userMessageResponse.json();

    // Add the message to the OpenAI thread
    await createOpenAIRequest(`threads/${threadId}/messages`, "POST", {
      role: "user",
      content: question
    });

    // Create a run with the assistant
    const run = await createOpenAIRequest(`threads/${threadId}/runs`, "POST", {
      assistant_id: assistant.openaiAssistantId,
      tools: [{ type: "file_search" }]
    });

    // Poll for run completion
    let runStatus = await createOpenAIRequest(
      `threads/${threadId}/runs/${run.id}`,
      "GET"
    );

    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await createOpenAIRequest(
        `threads/${threadId}/runs/${run.id}`,
        "GET"
      );
    }

    if (runStatus.status === "failed") {
      throw new Error("Assistant run failed");
    }

    // Get the latest messages from the thread
    const messagesResponse = await createOpenAIRequest(
      `threads/${threadId}/messages`,
      "GET"
    );

    // Find the assistant's response
    const assistantMessage = messagesResponse.data.find(
      (msg: OpenAIMessage) => msg.role === "assistant"
    );

    if (!assistantMessage) {
      throw new Error("No response from assistant");
    }

    let responseContent = "";

    // Extract the text content from the message
    if (assistantMessage.content.length > 0) {
      if (assistantMessage.content[0].type === "text") {
        responseContent = assistantMessage.content[0].text.value;
      }
    }

    // Save the assistant's response to our database
    const assistantMessageResponse = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: uuidv4(),
        threadId,
        content: responseContent,
        role: "assistant",
        createdAt: new Date().toISOString()
      })
    });

    return await assistantMessageResponse.json();
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
};

// Get message history for a user
export const getUserMessages = async (userId: string): Promise<Message[]> => {
  try {
    // Get assistant data
    const assistantResponse = await fetch(
      `${API_BASE_URL}/assistants?userId=${userId}`
    );
    const assistants = await assistantResponse.json();

    if (!assistants || assistants.length === 0) {
      return [];
    }

    const assistant = assistants[0];

    if (!assistant.threadId) {
      return [];
    }

    // Get messages for the thread
    const messagesResponse = await fetch(
      `${API_BASE_URL}/messages?threadId=${assistant.threadId}&_sort=createdAt&_order=asc`
    );

    return await messagesResponse.json();
  } catch (error) {
    console.error("Error getting user messages:", error);
    return [];
  }
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error getting all tenants:", error);
    return [];
  }
};

// Delete user and all related data (assistant, files, threads)
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    // 1. Get the user's assistant
    const assistantResponse = await fetch(
      `${API_BASE_URL}/assistants?userId=${userId}`
    );
    const assistants = await assistantResponse.json();
    const assistant = assistants.length > 0 ? assistants[0] : null;

    // 2. Get all user files
    const filesResponse = await fetch(`${API_BASE_URL}/files?userId=${userId}`);
    const files = await filesResponse.json();

    // 3. First delete files from OpenAI in parallel
    if (files.length > 0) {
      const apiKey = getApiKey();

      const fileDeletePromises = files.map(async (file: File) => {
        try {
          // Delete from OpenAI
          await fetch(`https://api.openai.com/v1/files/${file.openaiFileId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "OpenAI-Beta": "assistants=v2"
            }
          });

          // Delete from our database
          await fetch(`${API_BASE_URL}/files/${file.id}`, {
            method: "DELETE"
          });

          return true;
        } catch (fileError) {
          console.error(`Error deleting file ${file.id}:`, fileError);
          // Continue with deletion even if a file fails
          return false;
        }
      });

      await Promise.all(fileDeletePromises);
    }

    // 4. Delete assistant from OpenAI if it exists
    if (assistant?.openaiAssistantId) {
      try {
        await createOpenAIRequest(
          `assistants/${assistant.openaiAssistantId}`,
          "DELETE"
        );
      } catch (assistantError) {
        console.error("Error deleting OpenAI assistant:", assistantError);
        // Continue with deletion even if OpenAI assistant deletion fails
      }

      // Delete assistant from our database
      await fetch(`${API_BASE_URL}/assistants/${assistant.id}`, {
        method: "DELETE"
      });
    }

    // 5. Delete thread from OpenAI if it exists
    if (assistant?.threadId) {
      try {
        await createOpenAIRequest(`threads/${assistant.threadId}`, "DELETE");
      } catch (threadError) {
        console.error("Error deleting OpenAI thread:", threadError);
        // Continue with deletion even if thread deletion fails
      }
    }

    // 6. Finally delete the user
    const userDeleteResponse = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: "DELETE"
    });

    return userDeleteResponse.ok;
  } catch (error) {
    console.error("Error deleting tenant:", error);
    throw error;
  }
};

// Delete a file from both OpenAI and our database
export const deleteFile = async (
  fileId: string,
  userId: string
): Promise<boolean> => {
  try {
    // Get file data from database first
    const fileResponse = await fetch(`${API_BASE_URL}/files/${fileId}`);

    // If file not found in our database, return early
    if (!fileResponse.ok) {
      console.error("File not found in database");
      return false;
    }

    const fileData = await fileResponse.json();
    const openaiFileId = fileData.openaiFileId;

    // Delete from OpenAI if we have the openaiFileId
    if (openaiFileId) {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("OpenAI API key is not set");
      }

      // Delete the file from OpenAI
      const deleteResponse = await fetch(
        `https://api.openai.com/v1/files/${openaiFileId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2"
          }
        }
      );

      if (!deleteResponse.ok) {
        console.error(
          "Error deleting file from OpenAI:",
          await deleteResponse.json()
        );
        // Continue with local deletion even if OpenAI deletion fails
      }
    }

    // Delete the file from our database
    const deleteDbResponse = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: "DELETE"
    });

    if (!deleteDbResponse.ok) {
      throw new Error("Failed to delete file from database");
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

// Get file content from OpenAI
export const getFileContent = async (
  fileId: string
): Promise<{ content: string; url: string } | null> => {
  try {
    // Get file data from database
    const fileResponse = await fetch(`${API_BASE_URL}/files/${fileId}`);

    if (!fileResponse.ok) {
      throw new Error("File not found in database");
    }

    const fileData = await fileResponse.json();

    // For files uploaded to OpenAI assistants, we need a different approach
    // OpenAI doesn't allow direct download of assistant files, so we need to:
    // 1. Get file metadata from our database (which we already have)
    // 2. For text files: create a placeholder with available metadata
    // 3. For PDFs: create a placeholder message explaining the limitation

    // Create placeholder content based on file type
    let content = "";
    let url = "#";

    if (fileData.type === "text/plain") {
      // For text files, create a placeholder that shows file info
      content = `# ${fileData.name}\n\nFile ID: ${
        fileData.id
      }\nSize: ${formatFileSize(fileData.size)}\nType: ${
        fileData.type
      }\n\nNote: OpenAI doesn't allow direct download of assistant files. The content isn't accessible outside of the assistant's context.`;

      // Create a text blob for display
      const blob = new Blob([content], { type: "text/plain" });
      url = URL.createObjectURL(blob);
    } else if (fileData.type === "application/pdf") {
      // For PDFs, create an informational message
      content =
        "[PDF Content] - OpenAI doesn't allow direct download of assistant files. The PDF content is only accessible to the assistant during conversation.";

      // Create a text blob for display since we can't show the actual PDF
      const placeholderText = `PDF file "${fileData.name}" is attached to the assistant but can't be displayed directly due to OpenAI API limitations.`;
      const blob = new Blob([placeholderText], { type: "text/plain" });
      url = URL.createObjectURL(blob);
    }

    return { content, url };
  } catch (error) {
    console.error("Error getting file content:", error);
    return null;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};
