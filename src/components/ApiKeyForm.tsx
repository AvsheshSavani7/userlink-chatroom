
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Key, Check, AlertCircle } from 'lucide-react';
import { setApiKey, isApiKeySet } from '../services/openaiService';
import { toast } from 'sonner';

const ApiKeyForm = () => {
  const [apiKey, setApiKeyInput] = useState('');
  const [isValidKey, setIsValidKey] = useState(isApiKeySet());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    try {
      const result = setApiKey(apiKey.trim());
      if (result) {
        setIsValidKey(true);
        toast.success('API key saved successfully');
      } else {
        throw new Error('Invalid API key format');
      }
    } catch (error) {
      toast.error('Failed to save API key');
      setIsValidKey(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium">OpenAI API Key</h3>
        {isValidKey && (
          <span className="ml-auto flex items-center text-xs text-green-600">
            <Check className="w-3 h-3 mr-1" /> Configured
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="grid gap-1.5">
            <Label htmlFor="apiKey" className="text-xs font-medium">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className="h-8 text-sm"
            />
          </div>
          
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-gray-500 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Your API key is stored locally in your browser</span>
            </div>
            <Button type="submit" size="sm" className="h-7 text-xs px-2">
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApiKeyForm;
