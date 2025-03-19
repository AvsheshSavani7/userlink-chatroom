import { useState, useRef, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Bot, FileIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";

interface MessageProps {
  content: string;
  isUser: boolean;
  timestamp: Date;
  userName?: string;
  onSelectFile?: (fileName: string) => void;
}

// Custom type for code component props
interface CodeProps {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const MessageItem = ({
  content,
  isUser,
  timestamp,
  userName,
  onSelectFile
}: MessageProps) => {
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
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Process the content to format citations
  const formatContentWithCitations = (text: string) => {
    if (isUser) return text; // Only process assistant messages

    // Regular expression to match citation references like 【12:0†Understanding_Artificial_Intelligence.pdf】
    const citationRegex = /【(\d+):(\d+)†([^】]+)】/g;

    // Split the content by citation references
    const parts = text.split(citationRegex);

    if (parts.length <= 1) {
      return text; // No citations found
    }

    // Build the formatted content with citation components
    const formattedContent = [];
    let i = 0;

    while (i < parts.length) {
      // Add text content
      if (parts[i]) {
        formattedContent.push(parts[i]);
      }

      // If we have a citation, add it as a formatted component
      if (i + 3 < parts.length) {
        const page = parts[i + 1];
        const line = parts[i + 2];
        const fileName = parts[i + 3];

        formattedContent.push(
          <Button
            key={`citation-${i}`}
            variant="ghost"
            size="sm"
            className="inline-flex items-center gap-1 py-0 px-2 h-auto text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded"
            onClick={() => onSelectFile && onSelectFile(fileName)}
          >
            <FileIcon size={12} />
            <span>
              {fileName} (p.{page})
            </span>
          </Button>
        );

        i += 3; // Skip the captured groups
      }

      i++;
    }

    return formattedContent;
  };

  // Define custom components for markdown rendering
  const markdownComponents: Components = {
    // Styling for code blocks
    code({ node, inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";

      // Convert children array to a string
      const content = String(children).replace(/\n$/, "");

      return !inline ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          wrapLines={true}
          wrapLongLines={true}
          customStyle={{
            borderRadius: "0.375rem",
            fontSize: "0.8rem",
            margin: "0.5rem 0"
          }}
        >
          {content}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props}>
          {children}
        </code>
      );
    },
    // Style headings
    h1: ({ node, ...props }) => (
      <h1 className="text-lg font-bold mt-3 mb-1" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-md font-bold mt-3 mb-1" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-sm font-bold mt-2 mb-1" {...props} />
    ),
    // Style paragraphs
    p: ({ node, ...props }) => <p className="mb-2" {...props} />,
    // Style links
    a: ({ node, ...props }) => (
      <a className="text-blue-600 underline" {...props} />
    ),
    // Style lists
    ul: ({ node, ...props }) => (
      <ul className="list-disc pl-5 mb-2" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal pl-5 mb-2" {...props} />
    ),
    // Style blockquotes
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-2 border-gray-300 pl-2 italic my-2"
        {...props}
      />
    ),
    // Style tables
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-2">
        <table
          className="border-collapse border border-gray-300 text-xs"
          {...props}
        />
      </div>
    ),
    tr: ({ node, ...props }) => (
      <tr className="border-b border-gray-300" {...props} />
    ),
    th: ({ node, ...props }) => (
      <th className="border border-gray-300 px-2 py-1 bg-gray-200" {...props} />
    ),
    td: ({ node, ...props }) => (
      <td className="border border-gray-300 px-2 py-1" {...props} />
    )
  };

  // Process content to find citations before rendering
  const processedContent = isUser
    ? content
    : content.replace(/【(\d+):(\d+)†([^】]+)】/g, " _See [[$3]] (page $1)_ ");

  return (
    <div
      ref={messageRef}
      className={`flex items-start gap-3 mb-4 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease"
      }}
    >
      {!isUser && (
        <Avatar className="flex-shrink-0 bg-gray-100 text-gray-600 flex items-center justify-center">
          <Bot className="h-5 w-5" />
        </Avatar>
      )}

      <div
        className={`flex flex-col max-w-[80%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
          <Badge variant="outline" className="font-normal">
            {isUser ? userName || "You" : "Assistant"}
          </Badge>
        </div>

        <div
          className={`py-3 px-4 rounded-2xl message-appear
            ${isUser ? "bg-brand text-white" : "bg-gray-100 text-gray-800"}
          `}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="markdown-content text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                components={markdownComponents}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="flex-shrink-0 bg-brand/10 text-brand flex items-center justify-center">
          <User className="h-5 w-5" />
        </Avatar>
      )}
    </div>
  );
};

export default MessageItem;
