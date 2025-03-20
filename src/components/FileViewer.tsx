import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Maximize,
  Minimize,
  Download,
  FileText,
  X,
  File,
  FileIcon,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface FileViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
  isLoading?: boolean;
  fileId?: string;
}

const FileViewer = ({
  fileUrl,
  fileName,
  fileType,
  onClose,
  isLoading: externalLoading,
  fileId
}: FileViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper function to determine if we're trying to display a PDF
  const isPdf = () => {
    return (
      fileType === "application/pdf" ||
      fileName.toLowerCase().endsWith(".pdf") ||
      fileUrl.toLowerCase().includes(".pdf")
    );
  };

  // Helper function to determine if we're trying to display a text file
  const isTextFile = () => {
    return (
      fileType === "text/plain" ||
      fileName.toLowerCase().endsWith(".txt") ||
      fileName.toLowerCase().endsWith(".json") ||
      fileName.toLowerCase().endsWith(".csv") ||
      fileName.toLowerCase().endsWith(".md")
    );
  };

  const canUseIframe = () => {
    return (
      (isPdf() || (fileUrl && fileUrl !== "#" && !isTextFile())) &&
      !useGoogleViewer
    );
  };

  const canUseGoogleViewer = () => {
    return (
      (isPdf() || isTextFile()) &&
      fileUrl &&
      fileUrl !== "#" &&
      fileUrl.startsWith("http")
    );
  };

  // Get Google Docs Viewer URL
  const getGoogleViewerUrl = () => {
    if (!fileUrl || fileUrl === "#") return "";
    return `https://docs.google.com/viewer?url=${encodeURIComponent(
      fileUrl
    )}&embedded=true`;
  };

  // Load file content
  useEffect(() => {
    // If external loading state is provided, use it
    if (externalLoading !== undefined) {
      setIsLoading(externalLoading);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIframeError(false);

    if (isTextFile() && fileUrl && fileUrl !== "#") {
      fetch(fileUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              `Failed to load file: ${response.status} ${response.statusText}`
            );
          }
          return response.text();
        })
        .then((text) => {
          setTextContent(text);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error loading text file:", error);
          setError(
            "Error loading file content. The file may be unavailable or cannot be accessed."
          );
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [fileUrl, fileType, externalLoading]);

  // Prevent scrolling on the background when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleIframeError = () => {
    setIframeError(true);
    console.error("Failed to load file in iframe");

    // If Google Viewer is an option, suggest it
    if (canUseGoogleViewer() && !useGoogleViewer) {
      toast.info("Direct preview failed. Trying Google Docs Viewer...");
      setUseGoogleViewer(true);
    }
  };

  // Function to open the file in a new tab
  const openInNewTab = () => {
    if (fileUrl && fileUrl !== "#") {
      window.open(fileUrl, "_blank");
    } else {
      toast.error("Cannot open this file in a new tab");
    }
  };

  // Function to toggle between direct view and Google Docs Viewer
  const toggleViewMode = () => {
    setUseGoogleViewer(!useGoogleViewer);
    toast.info(
      useGoogleViewer
        ? "Switching to direct view"
        : "Switching to Google Docs Viewer"
    );
  };

  // Handle file download directly
  const handleDownload = async () => {
    if (!fileId) {
      console.log("No fileId available for download");
      if (fileUrl && fileUrl !== "#") {
        console.log("Using fileUrl for download:", fileUrl);
        window.open(fileUrl, "_blank");
      } else {
        toast.error("Cannot download this file - no file ID or URL available");
      }
      return;
    }

    try {
      console.log(`Initiating download for file ID: ${fileId}`);
      // For direct downloads using the file ID
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

      // Check if apiBaseUrl already contains /api to avoid duplication
      const downloadUrl = apiBaseUrl.endsWith("/api")
        ? `${apiBaseUrl}/files/${fileId}/download`
        : `${apiBaseUrl}/api/files/${fileId}/download`;

      console.log(`Download URL: ${downloadUrl}`);

      // Create a hidden anchor element to trigger the download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      link.setAttribute("target", "_blank");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      console.error("Error initiating download:", error);
      toast.error(`Failed to download file: ${(error as Error).message}`);
    }
  };

  const getFileViewerContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="text-red-500 mb-2">
            <X size={40} />
          </div>
          <p className="text-gray-700 mb-2">{error}</p>
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      );
    }

    if (fileUrl === "#") {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div
            className={`w-16 h-16 ${
              isPdf() ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
            } rounded-full flex items-center justify-center mb-4`}
          >
            {isPdf() ? <FileIcon size={32} /> : <FileText size={32} />}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {isPdf() ? "PDF" : "Text"} File Attached
          </h3>
          <p className="text-gray-600 mb-4 max-w-md">
            "{fileName}" is attached to your assistant and can be referenced in
            conversations, but OpenAI does not allow direct viewing of
            assistant-attached files outside of the AI context.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 text-sm text-amber-800 max-w-md">
            While you can't preview this file here, the AI assistant can access
            its content when answering your questions. Try asking about the
            content of this file in your chat.
          </div>
        </div>
      );
    }

    if (useGoogleViewer && canUseGoogleViewer()) {
      return (
        <div className="w-full h-full flex flex-col">
          <div className="bg-gray-50 p-2 text-xs text-gray-500 flex items-center justify-between">
            <span>Viewing with Google Docs Viewer</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleViewMode}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              <span>Try Direct View</span>
            </Button>
          </div>
          <div className="flex-1">
            <iframe
              src={getGoogleViewerUrl()}
              className="w-full h-full border rounded"
              title={`${fileName} (Google Docs Viewer)`}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>
      );
    }

    if (canUseIframe() && !iframeError) {
      return (
        <div className="w-full h-full">
          <iframe
            ref={iframeRef}
            src={fileUrl}
            className="w-full h-full border rounded"
            title={fileName}
            sandbox="allow-scripts allow-same-origin"
            onError={handleIframeError}
          />
        </div>
      );
    }

    if (isTextFile()) {
      return (
        <pre className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded border h-full overflow-auto">
          {textContent || "No content available"}
        </pre>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-yellow-500 mb-2">
          <File size={40} />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          File Preview Not Available
        </h3>
        <p className="text-gray-700 mb-4">
          This file type cannot be displayed in the browser. Please download the
          file to view its contents.
        </p>
        <div className="flex gap-3">
          {canUseGoogleViewer() && (
            <Button size="sm" variant="outline" onClick={toggleViewMode}>
              <RefreshCw size={16} className="mr-2" />
              Try Google Viewer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={openInNewTab}
            disabled={!fileUrl || fileUrl === "#"}
          >
            <ExternalLink size={16} className="mr-2" />
            Open in New Tab
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card
      className={`
        flex flex-col bg-white rounded-lg shadow-lg transition-all duration-300
        ${
          isFullscreen
            ? "fixed inset-0 z-50 rounded-none"
            : "absolute inset-0 z-10"
        }
      `}
      ref={containerRef}
    >
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="mr-2"
          >
            {isFullscreen ? <X size={18} /> : <ChevronLeft size={18} />}
          </Button>
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded flex items-center justify-center mr-2 ${
                isPdf()
                  ? "bg-red-100 text-red-700"
                  : isTextFile()
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {isPdf() ? (
                <FileIcon size={18} />
              ) : isTextFile() ? (
                <FileText size={18} />
              ) : (
                <File size={18} />
              )}
            </div>
            <h3 className="text-base font-medium truncate max-w-[200px]">
              {fileName}
            </h3>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download file"
            className="mr-1"
          >
            <Download size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{getFileViewerContent()}</div>
    </Card>
  );
};

export default FileViewer;
