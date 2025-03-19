
import { useState } from 'react';
import { Upload, X, File as FileIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppSelector } from '../store/hooks';
import { createVectorEmbeddings, isApiKeySet } from '../services/openaiService';
import { FileInfo } from '../types/file';

interface FileUploaderProps {
  onFileUploaded: (file: FileInfo) => void;
}

const FileUploader = ({ onFileUploaded }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const userId = useAppSelector(state => state.user.id);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    
    // Validate file type (PDF or TXT)
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      toast.error('Only PDF and TXT files are supported');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB');
      return;
    }
    
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Create object URL for local preview
      const fileUrl = URL.createObjectURL(file);
      
      // Read file content
      const fileContent = await readFileContent(file);
      
      const fileInfo: FileInfo = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        content: fileContent
      };
      
      onFileUploaded(fileInfo);
      
      // If OpenAI API key is configured, process the file
      if (isApiKeySet()) {
        setIsProcessing(true);
        
        // Create vector embeddings
        const success = await createVectorEmbeddings(
          fileContent,
          file.name,
          fileInfo.id,
          file.size,
          file.type,
          userId
        );
        
        if (success) {
          toast.success(`${file.name} processed and added to knowledge base`);
        } else {
          toast.error(`Failed to process ${file.name} for AI responses`);
        }
        
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Error processing file: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'text/plain') {
        // Read as text for TXT files
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string || '');
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // For PDF, we're just returning a placeholder message since parsing PDF content
        // requires additional libraries like pdf.js
        resolve(`[PDF Content from: ${file.name}] - To fully support PDF content extraction, a PDF parser library would be needed.`);
      } else {
        reject(new Error('Unsupported file type'));
      }
    });
  };

  return (
    <div
      className={`flex flex-col items-center p-6 mt-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
        isDragging 
          ? 'border-brand bg-brand/5' 
          : 'border-gray-200 bg-gray-50/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Upload 
        className={`mb-3 ${isDragging ? 'text-brand' : 'text-gray-400'}`} 
        size={24} 
      />
      <p className="mb-2 text-sm font-medium text-gray-700">
        {isDragging ? 'Drop file here' : 'Drag & drop a file or click to browse'}
      </p>
      <p className="mb-4 text-xs text-gray-500">PDF or TXT (max 10MB)</p>
      
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.txt"
      />
      
      <Button
        variant="outline"
        className="text-sm rounded-lg h-9"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isUploading || isProcessing}
      >
        {isUploading ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : isProcessing ? (
          <span className="text-xs">Processing...</span>
        ) : (
          'Select File'
        )}
      </Button>
      
      {!isApiKeySet() && (
        <p className="mt-3 text-xs text-amber-600">
          OpenAI API key not configured. Files won't be processed for AI responses.
        </p>
      )}
    </div>
  );
};

export default FileUploader;
