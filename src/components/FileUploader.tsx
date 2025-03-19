
import { useState } from 'react';
import { Upload, X, File as FileIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAppSelector } from '../store/hooks';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FileUploaderProps {
  onFileUploaded: (file: FileInfo) => void;
}

const FileUploader = ({ onFileUploaded }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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

  const uploadFile = (file: File) => {
    setIsUploading(true);
    
    // Create object URL for local preview
    const fileUrl = URL.createObjectURL(file);
    
    // Simulate upload delay
    setTimeout(() => {
      const fileInfo: FileInfo = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
      };
      
      onFileUploaded(fileInfo);
      setIsUploading(false);
      toast.success(`${file.name} uploaded successfully`);
    }, 1500);
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
        disabled={isUploading}
      >
        {isUploading ? (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : (
          'Select File'
        )}
      </Button>
    </div>
  );
};

export default FileUploader;
