
import { useState, useEffect } from 'react';
import { ChevronLeft, Maximize, Minimize, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  onClose: () => void;
}

const FileViewer = ({ fileUrl, fileName, fileType, onClose }: FileViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textContent, setTextContent] = useState<string>('');
  
  useEffect(() => {
    if (fileType === 'text/plain') {
      fetch(fileUrl)
        .then(response => response.text())
        .then(text => {
          setTextContent(text);
        })
        .catch(error => {
          console.error('Error loading text file:', error);
          setTextContent('Error loading file content');
        });
    }
  }, [fileUrl, fileType]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  return (
    <div className={`
      flex flex-col bg-white rounded-lg shadow-premium transition-all duration-300
      ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`
    }>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="mr-2"
          >
            <ChevronLeft size={18} />
          </Button>
          <h3 className="text-base font-medium truncate max-w-[200px]">{fileName}</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.open(fileUrl, '_blank')}
          >
            <Download size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        {fileType === 'application/pdf' ? (
          <iframe
            src={`${fileUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border rounded"
            title={fileName}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded border h-full overflow-auto">
            {textContent}
          </pre>
        )}
      </div>
    </div>
  );
};

export default FileViewer;
