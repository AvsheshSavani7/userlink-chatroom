
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { createUser } from '../store/userSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const UserNameForm = () => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    
    // Simulate a small delay for the animation
    setTimeout(() => {
      dispatch(createUser({ name: name.trim() }));
      toast.success(`Welcome, ${name}!`);
      navigate('/chat');
      setIsLoading(false);
    }, 800);
  };

  return (
    <Card className="w-full max-w-md glass-effect animate-scale-in">
      <CardHeader>
        <CardTitle className="text-2xl font-medium text-center">Create Your Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 px-4 rounded-xl"
              autoFocus
            />
          </div>
          <CardFooter className="px-0 pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium rounded-xl transition-all duration-300 bg-brand hover:bg-brand-dark"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                'Start Chatting'
              )}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserNameForm;
