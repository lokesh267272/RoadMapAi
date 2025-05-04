
import React from "react";
import { Sparkles } from "lucide-react";

const GenerationAnimation = () => {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
      <div className="relative flex flex-col items-center">
        <div className="w-16 h-16 relative animate-pulse">
          <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
          <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary animate-bounce" />
        </div>
        
        {/* Animated particles */}
        <div className="absolute">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-primary"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 100 - 50}px`,
                top: `${Math.random() * 100 - 50}px`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `float ${Math.random() * 3 + 2}s infinite ease-in-out ${Math.random()}s`
              }}
            />
          ))}
        </div>
        
        {/* Pulsating circles */}
        <div className="absolute -z-10">
          <div className="h-16 w-16 rounded-full bg-primary/10 animate-ping"></div>
        </div>
        <div className="absolute -z-10">
          <div className="h-24 w-24 rounded-full bg-primary/5 animate-ping [animation-duration:3s]"></div>
        </div>
      </div>
      
      <h3 className="mt-8 text-lg font-medium">Creating Your Learning Roadmap</h3>
      <p className="mt-2 text-muted-foreground text-center max-w-xs">
        Our AI is crafting a personalized learning path just for you. This may take a moment...
      </p>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) translateX(${Math.random() * 50 - 25}px) rotate(${Math.random() * 360}deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default GenerationAnimation;
