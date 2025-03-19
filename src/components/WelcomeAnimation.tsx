import React from "react";
import { MessageCircle } from "lucide-react";

const WelcomeAnimation = () => {
  return (
    <div className="relative h-60 w-60 flex items-center justify-center animate-float">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full opacity-20"></div>
      <div className="absolute inset-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full opacity-30"></div>
      <div className="absolute inset-8 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full opacity-40"></div>
      <div className="bg-white p-8 rounded-full shadow-premium z-10">
        <MessageCircle size={80} className="text-brand" strokeWidth={1.5} />
      </div>
    </div>
  );
};

export default WelcomeAnimation;
