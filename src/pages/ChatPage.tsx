
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Send, ChevronLeft, Plus, X, Bot, User } from 'lucide-react';
import MessageItem from '../components/MessageItem';
import FileUploader from '../components/FileUploader';
import FileItem from '../components/FileItem';
import FileViewer from '../components/FileViewer';
import ApiKeyForm from '../components/ApiKeyForm';
import { FileInfo } from '../types/file';
import { 
  generateChatResponse, 
  saveChatHistory, 
  getChatHistory,
  isApiKeySet
} from '../services/openaiService';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showApiForm, setShowApiForm] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { id: userId, name: userName, isAuthenticated } = useAppSelector(state => state.user);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Load chat history from localStorage
  useEffect(() => {
    if (isAuthenticated && userId) {
      const savedMessages = getChatHistory(userId);
      if (savedMessages && savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Add welcome message if no history
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: `Hello ${userName}! Welcome to the AI-powered chat. How can I assist you today?`,
          isUser: false,
          timestamp: new Date()
        };
        
        setTimeout(() => {
          setMessages([welcomeMessage]);
        }, 500);
      }
    }
  }, [isAuthenticated, userId, userName]);
  
  // Save chat history when messages change
  useEffect(() => {
    if (isAuthenticated && userId && messages.length > 0) {
      saveChatHistory(userId, messages);
    }
  }, [messages, isAuthenticated, userId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Show typing indicator
    setIsTyping(true);
    
    try {
      // Check if OpenAI API key is set
      if (!isApiKeySet()) {
        setTimeout(() => {
          const noApiKeyMessage: Message = {
            id: Date.now().toString(),
            content: "OpenAI API key is not configured. Please set your API key to enable AI-powered responses.",
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, noApiKeyMessage]);
          setIsTyping(false);
          setShowApiForm(true);
        }, 1000);
        return;
      }
      
      // Generate response from OpenAI
      const response = await generateChatResponse(
        messages,
        inputMessage,
        userId
      );
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "Sorry, I couldn't generate a response. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileUpload = (file: FileInfo) => {
    setFiles(prev => [...prev, file]);
    setShowUploader(false);
    
    // Notify user about the file being added
    if (!isApiKeySet()) {
      toast.info('Set your OpenAI API key to enable AI responses about this document', {
        duration: 5000,
        action: {
          label: 'Set Key',
          onClick: () => setShowApiForm(true),
        },
      });
    }
  };
  
  const handleFileDelete = (fileId: string) => {
    if (selectedFileId === fileId) {
      setSelectedFileId(null);
    }
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  const selectedFile = files.find(file => file.id === selectedFileId);
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white glass-effect z-10">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="mr-2"
          >
            <ChevronLeft size={20} />
          </Button>
          <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
        </div>
        <div className="text-sm text-gray-500">
          Logged in as <span className="font-medium text-brand">{userName}</span>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for files */}
        <div className="w-[300px] border-r bg-gray-50 flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Your Files</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setShowUploader(!showUploader);
                  setShowApiForm(false);
                }}
                className="h-8 w-8"
              >
                {showUploader ? <X size={16} /> : <Plus size={16} />}
              </Button>
            </div>
            
            {showUploader ? (
              <FileUploader onFileUploaded={handleFileUpload} />
            ) : showApiForm ? (
              <ApiKeyForm />
            ) : (
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Upload PDFs or text files to reference in your chat
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiForm(!showApiForm)}
                  className="h-7 text-xs"
                >
                  API Key
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {files.length > 0 ? (
              files.map(file => (
                <FileItem 
                  key={file.id}
                  id={file.id}
                  name={file.name}
                  size={file.size}
                  type={file.type}
                  url={file.url}
                  onSelect={setSelectedFileId}
                  onDelete={handleFileDelete}
                  isSelected={selectedFileId === file.id}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4 text-gray-500">
                <p className="mb-2 text-sm">No files uploaded yet</p>
                <Button 
                  variant="outline" 
                  onClick={() => setShowUploader(true)}
                  className="text-xs h-8"
                >
                  Upload a file
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* File viewer or chat area */}
        <div className="flex-1 flex">
          {selectedFile ? (
            <FileViewer 
              fileUrl={selectedFile.url} 
              fileName={selectedFile.name}
              fileType={selectedFile.type}
              onClose={() => setSelectedFileId(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="flex flex-col items-start max-w-4xl mx-auto">
                  {messages.map(message => (
                    <MessageItem 
                      key={message.id}
                      content={message.content}
                      isUser={message.isUser}
                      timestamp={message.timestamp}
                      userName={userName}
                    />
                  ))}
                  
                  {isTyping && (
                    <div className="flex items-start gap-3 mb-4 max-w-3xl self-start animate-fade-in">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot size={20} className="text-gray-600" />
                      </div>
                      <div className="py-3 px-4 rounded-2xl bg-gray-100">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </div>
              
              {/* Input */}
              <div className="p-4 border-t bg-white glass-effect">
                <div className="max-w-4xl mx-auto">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-1 h-12 rounded-xl border-gray-200 focus:ring-brand"
                    />
                    <Button 
                      type="submit" 
                      className="h-12 w-12 rounded-xl bg-brand hover:bg-brand-dark"
                      disabled={!inputMessage.trim() || isTyping}
                    >
                      <Send size={18} />
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
