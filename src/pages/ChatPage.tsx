import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { createUser } from "../store/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Send, ChevronLeft, Plus, X, Bot, User, Calendar } from "lucide-react";
import MessageItem from "../components/MessageItem";
import FileUploader from "../components/FileUploader";
import FileItem from "../components/FileItem";
import FileViewer from "../components/FileViewer";
import { FileInfo } from "../types/file";
import {
  askQuestion,
  getUserMessages,
  getUserFiles,
  User as UserType,
  deleteFile,
  getFileContent
} from "../services/assistantService";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
}

// Helper functions for date formatting
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
};

const formatMessageDate = (date: Date): string => {
  if (isToday(date)) {
    return "Today";
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
};

// Interface for grouped messages
interface MessageGroup {
  date: string;
  dateObj: Date;
  messages: Message[];
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [fileContents, setFileContents] = useState<
    Record<string, { content: string; url: string }>
  >({});
  const [isFileLoading, setIsFileLoading] = useState<Record<string, boolean>>(
    {}
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { userId } = useParams<{ userId: string }>();

  const {
    id: storeUserId,
    name: storeName,
    isAuthenticated
  } = useAppSelector((state) => state.user);

  // Add a new logger effect after other useEffects
  useEffect(() => {
    console.log("ChatPage mounted, path:", window.location.pathname);
    console.log("userId param:", userId);
    console.log("storeUserId:", storeUserId);
    console.log("isAuthenticated:", isAuthenticated);
  }, [userId, storeUserId, isAuthenticated]);

  // Handle user authentication from URL param or Redux store
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);

      try {
        // If we have a userId in the URL, try to load that user
        if (userId) {
          // Fetch user data from the API
          const response = await fetch(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:3002"
            }/users/${userId}`
          );

          if (response.ok) {
            const userData = await response.json();

            // Update Redux store with this user
            dispatch(
              createUser({
                id: userData.id,
                name: userData.name
              })
            );

            setUserDetails(userData);
            setIsLoading(false);
            return;
          }
        }

        // If we have a user in the Redux store but no userId in URL,
        // redirect to the user-specific URL
        if (isAuthenticated && storeUserId) {
          navigate(`/chat/${storeUserId}`, { replace: true });
          setIsLoading(false);
          return;
        }

        // If no valid user is found, redirect to the home page
        if (!isAuthenticated && !userId) {
          navigate("/");
        }
      } catch (error) {
        console.error("Error loading tenant data:", error);
        toast.error("Failed to load tenant data");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [userId, isAuthenticated, storeUserId, navigate, dispatch]);

  // Load chat history and files when user is authenticated
  useEffect(() => {
    const currentUserId = userId || storeUserId;

    if (currentUserId) {
      const loadMessages = async () => {
        try {
          console.log("Loading messages for user:", currentUserId);
          const userMessages = await getUserMessages(currentUserId);
          console.log("User messages loaded:", userMessages);

          if (userMessages && userMessages.length > 0) {
            console.log(`Setting ${userMessages.length} messages`);
            setMessages(userMessages);
          } else {
            console.log("No messages found, adding welcome message");
            // Add welcome message if no history
            const welcomeMessage: Message = {
              id: Date.now().toString(),
              content: `Hello ${
                storeName || userDetails?.name || "there"
              }! Welcome to the AI-powered chat. How can I assist you today?`,
              role: "assistant",
              createdAt: new Date().toISOString()
            };

            setMessages([welcomeMessage]);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          // Instead of just showing a toast, add a welcome message here too
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            content: `Hello ${
              storeName || userDetails?.name || "there"
            }! Welcome to the AI-powered chat. How can I assist you today?`,
            role: "assistant",
            createdAt: new Date().toISOString()
          };

          setMessages([welcomeMessage]);

          toast.error("Failed to load chat history");
        }
      };

      const loadFiles = async () => {
        try {
          const userFiles = await getUserFiles(currentUserId);
          if (userFiles && userFiles.length > 0) {
            // Transform API files to FileInfo format
            const fileInfos: FileInfo[] = userFiles.map((file) => ({
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              url: "#" // We don't have URLs for API-stored files
            }));
            setFiles(fileInfos);
          }
        } catch (error) {
          console.error("Error loading files:", error);
          toast.error("Failed to load files");
        }
      };

      loadMessages();
      loadFiles();
    }
  }, [userId, storeUserId, storeName, userDetails]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: MessageGroup[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const dateStr = formatMessageDate(messageDate);

      const existingGroup = groups.find((group) => group.date === dateStr);

      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: dateStr,
          dateObj: messageDate,
          messages: [message]
        });
      }
    });

    // Sort groups by date (oldest first)
    return groups.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const currentUserId = userId || storeUserId;
    if (!currentUserId) {
      toast.error("User not authenticated");
      return;
    }

    // Create user message object
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      createdAt: new Date().toISOString()
    };

    // Add user message to the UI
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");

    // Show typing indicator
    setIsTyping(true);

    try {
      // Send message to OpenAI assistant
      const response = await askQuestion(currentUserId, inputMessage);

      // Add assistant response to the UI
      setMessages((prev) => [...prev, response]);
    } catch (error) {
      console.error("Error generating response:", error);

      // Create error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't generate a response. Please try again.",
        role: "assistant",
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (file: FileInfo) => {
    setFiles((prev) => [...prev, file]);
    setShowUploader(false);
    toast.success(`${file.name} uploaded successfully`);
  };

  const handleFileDelete = async (fileId: string) => {
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }

    const currentUserId = userId || storeUserId;
    if (!currentUserId) {
      toast.error("Tenant not authenticated");
      return;
    }

    // Show loading toast
    const toastId = toast.loading(
      `Deleting ${files.find((f) => f.id === fileId)?.name}...`
    );

    try {
      // Delete file from OpenAI and database
      const success = await deleteFile(fileId, currentUserId);

      if (success) {
        // Remove file from local state
        setFiles((prev) => prev.filter((file) => file.id !== fileId));

        // Clean up any cached content
        setFileContents((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });

        // Update toast
        toast.success(`File deleted successfully`, { id: toastId });
      } else {
        toast.error(`Failed to delete file`, { id: toastId });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error(`Error deleting file: ${(error as Error).message}`, {
        id: toastId
      });
    }
  };

  const handleSelectFile = async (fileId: string) => {
    setSelectedFileId(fileId);

    // If we don't have the content yet, fetch it
    if (!fileContents[fileId] && !isFileLoading[fileId]) {
      setIsFileLoading((prev) => ({ ...prev, [fileId]: true }));

      try {
        const result = await getFileContent(fileId);

        if (result) {
          setFileContents((prev) => ({
            ...prev,
            [fileId]: result
          }));
        }
      } catch (error) {
        console.error("Error fetching file content:", error);
        toast.error(`Error loading file: ${(error as Error).message}`);
      } finally {
        setIsFileLoading((prev) => ({ ...prev, [fileId]: false }));
      }
    }
  };

  const selectedFile = files.find((file) => file.id === selectedFileId);
  const selectedFileContent = selectedFile && fileContents[selectedFile.id];

  // Inside the ChatPage component, add handleCitationFileSelect function
  const handleCitationFileSelect = (fileName: string) => {
    // Find the file by name
    const file = files.find((file) => file.name === fileName);
    if (file) {
      handleSelectFile(file.id);
    } else {
      toast.info(
        `The file "${fileName}" is referenced but not available for direct viewing.`
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Header - Fixed at top */}
      <header className="flex items-center justify-between p-4 border-b bg-white glass-effect z-10 shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Only navigate to home if we're on a user-specific chat page
              const currentPath = window.location.pathname;
              if (currentPath === "/") {
                // We're already at the root chat page, don't navigate
                toast.info("Already at chat home");
              } else {
                // We're either in a user chat or another page, safe to navigate home
                navigate("/", { replace: true });
              }
            }}
            className="mr-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User size={16} className="text-primary" />
          </div>
          <div className="text-sm">
            <span className="font-medium text-brand">
              {storeName || userDetails?.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main content area - Takes remaining height with hidden overflow */}
      <div className="flex flex-1 overflow-hidden">
        {/* Files sidebar - Fixed with its own scrolling */}
        <div className="w-64 border-r hidden md:flex md:flex-col bg-gray-50 h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Files</h2>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowUploader(!showUploader)}
            >
              {showUploader ? <X size={18} /> : <Plus size={18} />}
            </Button>
          </div>

          <div className="flex-1 overflow-hidden">
            {showUploader ? (
              <div className="p-4">
                <FileUploader
                  userId={userId || storeUserId || ""}
                  onFileUploaded={handleFileUpload}
                />
              </div>
            ) : (
              <div className="overflow-y-auto h-full p-4">
                {files.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No files uploaded. Upload files to allow AI to reference
                    them.
                  </p>
                ) : (
                  files.map((file) => (
                    <FileItem
                      key={file.id}
                      id={file.id}
                      name={file.name}
                      size={file.size}
                      type={file.type}
                      url={file.url || "#"}
                      isSelected={selectedFileId === file.id}
                      onSelect={() => handleSelectFile(file.id)}
                      onDelete={handleFileDelete}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat area - Flexible with message scroll */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* File viewer modal */}
          {selectedFile && selectedFileId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
              <FileViewer
                fileUrl={selectedFileContent?.url || "#"}
                fileName={selectedFile.name}
                fileType={selectedFile.type}
                onClose={() => setSelectedFileId(null)}
                isLoading={isFileLoading[selectedFileId]}
                fileId={selectedFileId}
              />
            </div>
          )}

          {/* Messages container - Only this should scroll */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-3xl mx-auto p-4 space-y-6 pb-4">
              {groupedMessages.map((group, groupIndex) => (
                <div key={group.date} className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{group.date}</span>
                    </div>
                  </div>

                  {group.messages.map((message) => (
                    <MessageItem
                      key={message.id}
                      content={message.content}
                      isUser={message.role === "user"}
                      timestamp={new Date(message.createdAt)}
                      userName={storeName || userDetails?.name}
                      onSelectFile={handleCitationFileSelect}
                    />
                  ))}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start gap-3 w-full justify-start">
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <Card className="max-w-[80%] p-4 shadow-sm">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message input - Fixed at bottom */}
          <div className="border-t p-4 bg-white glass-effect z-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowUploader(!showUploader)}
                  title="Upload File"
                >
                  <Plus size={18} />
                </Button>

                <div className="flex-1 flex items-center gap-2 border rounded-lg bg-background pl-4 focus-within:ring-1 focus-within:ring-ring focus-within:ring-offset-0 shadow-sm hover:shadow">
                  <Input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 py-6"
                  />
                  <Button
                    type="submit"
                    size="default"
                    className="rounded-l-none h-full"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                  >
                    <Send size={18} className="mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
