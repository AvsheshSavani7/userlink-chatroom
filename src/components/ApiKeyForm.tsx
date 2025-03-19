import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Key, Check, AlertCircle, X } from "lucide-react";
import { setApiKey, isApiKeySet } from "../services/openaiService";
import { toast } from "sonner";

interface ApiKeyFormProps {
  onClose?: () => void;
  userId?: string;
}

const ApiKeyForm = ({ onClose, userId }: ApiKeyFormProps) => {
  const [apiKey, setApiKeyInput] = useState("");
  const [isValidKey, setIsValidKey] = useState(false);

  // Check for environment variable API key on component mount
  useEffect(() => {
    const isKeySet = isApiKeySet();
    setIsValidKey(isKeySet);

    if (isKeySet && import.meta.env.VITE_OPENAI_API_KEY) {
      toast.success("Using OpenAI API key from environment variables");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }

    try {
      const result = setApiKey(apiKey.trim());
      if (result) {
        setIsValidKey(true);
        toast.success("API key saved successfully");
        if (onClose) onClose();
      } else {
        throw new Error("Invalid API key format");
      }
    } catch (error) {
      toast.error("Failed to save API key");
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
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-6 w-6"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        )}
      </div>

      {import.meta.env.VITE_OPENAI_API_KEY ? (
        <div className="text-xs text-green-600 mb-3">
          Using API key from environment variables
        </div>
      ) : (
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
      )}
    </div>
  );
};

export default ApiKeyForm;
