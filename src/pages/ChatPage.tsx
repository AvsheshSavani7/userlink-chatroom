
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Send, ChevronLeft, Plus, X } from 'lucide-react';
import MessageItem from '../components/MessageItem';
import FileUploader from '../components/FileUploader';
import FileItem from '../components/FileItem';
import FileViewer from '../components/FileViewer';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { id: userId, name: userName, isAuthenticated } = useAppSelector(state => state.user);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Add welcome message
  useEffect(() => {
    if (isAuthenticated && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        content: `Hello ${userName}! Welcome to Minimalist Chat. How can I assist you today?`,
        isUser: false,
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages([welcomeMessage]);
      }, 500);
    }
  }, [isAuthenticated, userName, messages.length]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: getAssistantResponse(inputMessage),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };
  
  const getAssistantResponse = (userInput: string) => {
    const lowercaseInput = userInput.toLowerCase();
    
    if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi')) {
      return `Hello ${userName}! How can I help you today?`;
    } else if (lowercaseInput.includes('how are you')) {
      return "I'm just a digital assistant, but I'm functioning well. Thank you for asking! How can I assist you?";
    } else if (lowercaseInput.includes('thank')) {
      return "You're welcome! Feel free to ask if you need anything else.";
    } else if (lowercaseInput.includes('file') || lowercaseInput.includes('document') || lowercaseInput.includes('upload')) {
      return "You can upload PDF or TXT files using the file upload panel on the left side. I can help you analyze or discuss those documents.";
    } else if (lowercaseInput.includes('help')) {
      return "I can chat with you, answer questions, or help you with uploaded documents. What would you like assistance with?";
    } else {
      return "I understand you've sent a message. How can I help you with that?";
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
          <h1 className="text-xl font-semibold">Minimalist Chat</h1>
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
                onClick={() => setShowUploader(!showUploader)}
                className="h-8 w-8"
              >
                {showUploader ? <X size={16} /> : <Plus size={16} />}
              </Button>
            </div>
            
            {showUploader ? (
              <FileUploader onFileUploaded={handleFileUpload} />
            ) : (
              <p className="text-xs text-gray-500">
                Upload PDFs or text files to reference in your chat
              </p>
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
