
import { useState } from 'react';
import { FileText, FileIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileItemProps {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  onSelect: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  isSelected: boolean;
}

const FileItem = ({ 
  id, 
  name, 
  size, 
  type, 
  url, 
  onSelect, 
  onDelete,
  isSelected 
}: FileItemProps) => {
  const [isHovering, setIsHovering] = useState(false);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`${name} deleted`);
    onDelete(id);
  };
  
  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toUpperCase();
  };

  return (
    <div 
      className={`relative flex items-center p-3 rounded-lg mb-2 file-card cursor-pointer
        ${isSelected ? 'bg-brand/10 border border-brand/30' : 'bg-white border hover:border-brand/20'}
      `}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex-shrink-0 mr-3">
        {type === 'application/pdf' ? (
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded">
            <FileText size={20} />
          </div>
        ) : (
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded">
            <FileText size={20} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-gray-900 truncate" title={name}>
            {name}
          </p>
        </div>
        <div className="flex items-center mt-1">
          <Badge variant="outline" className="mr-2 text-xs">
            {getFileExtension(name)}
          </Badge>
          <span className="text-xs text-gray-500">{formatFileSize(size)}</span>
        </div>
      </div>
      
      {(isHovering || isSelected) && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 w-6 h-6 text-gray-400 hover:text-red-500 hover:bg-red-50"
          onClick={handleDelete}
        >
          <X size={14} />
        </Button>
      )}
    </div>
  );
};

export default FileItem;
