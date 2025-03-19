
import React from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import UserNameForm from '../components/UserNameForm';
import WelcomeAnimation from '../components/WelcomeAnimation';

const Index = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(state => state.user.isAuthenticated);
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-white to-blue-50">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
        <div className="mb-2 animate-fade-in">
          <WelcomeAnimation />
        </div>
        
        <div className="w-full max-w-4xl text-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Welcome to Minimalist Chat</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the simplicity of modern conversations with our elegantly designed chat platform.
          </p>
        </div>
        
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <UserNameForm />
        </div>
      </div>
      
      <footer className="mt-auto pt-8 w-full text-center text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p>Designed with simplicity in mind.</p>
      </footer>
    </div>
  );
};

export default Index;
