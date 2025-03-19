
import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Bot } from 'lucide-react';

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  userName?: string;
}

const MessageItem = ({ content, isUser, timestamp, userName }: MessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (messageRef.current) {
      observer.observe(messageRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div 
      ref={messageRef}
      className={`flex items-start gap-3 mb-4 max-w-3xl ${isUser ? 'self-end' : 'self-start'}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {!isUser && (
        <Avatar className="flex-shrink-0 bg-gray-100 text-gray-600">
          <Bot size={20} />
        </Avatar>
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
          <Badge variant="outline" className="font-normal">
            {isUser ? userName || 'You' : 'Assistant'}
          </Badge>
        </div>
        
        <div 
          className={`py-3 px-4 rounded-2xl max-w-3xl message-appear
            ${isUser 
              ? 'bg-brand text-white' 
              : 'bg-gray-100 text-gray-800'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="flex-shrink-0 bg-brand/10 text-brand">
          <User size={20} />
        </Avatar>
      )}
    </div>
  );
};

export default MessageItem;
