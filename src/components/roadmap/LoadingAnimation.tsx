import { useState, useEffect } from "react";

interface LoadingAnimationProps {
  isLoading: boolean;
}

function PulsingDot() {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScale(prev => prev === 1 ? 1.2 : 1);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div 
      className="w-8 h-8 rounded-full bg-white opacity-80"
      style={{ 
        transform: `scale(${scale})`,
        transition: 'transform 0.8s ease-in-out'
      }}
    />
  );
}

function OrbitingParticles({ rotation }: { rotation: number }) {
  const particles = [0, 45, 90, 135, 180, 225, 270, 315];
  
  return (
    <>
      {particles.map((angle, i) => {
        const actualAngle = (angle + rotation * 0.5) % 360;
        const radians = (actualAngle * Math.PI) / 180;
        const x = Math.cos(radians) * 60;
        const y = Math.sin(radians) * 60;
        
        return (
          <div 
            key={i}
            className="absolute w-3 h-3 rounded-full bg-primary/40"
            style={{
              left: 'calc(50% - 6px)',
              top: 'calc(50% - 6px)',
              transform: `translate(${x}px, ${y}px)`,
              opacity: 0.6 + Math.sin(rotation / 30 + i) * 0.4
            }}
          />
        );
      })}
    </>
  );
}

export function LoadingAnimation({ isLoading }: LoadingAnimationProps) {
  const [rotation, setRotation] = useState(0);
  
  useEffect(() => {
    if (!isLoading) return;
    
    const animationFrame = requestAnimationFrame(function animate() {
      setRotation(prev => (prev + 1) % 360);
      requestAnimationFrame(animate);
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative w-48 h-48">
        {/* Outer spinning ring */}
        <div 
          className="absolute inset-0 rounded-full border-8 border-primary/30 border-t-primary"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        
        {/* Middle spinning ring - opposite direction */}
        <div 
          className="absolute inset-4 rounded-full border-6 border-primary/30 border-t-primary"
          style={{ transform: `rotate(${-rotation * 1.5}deg)` }}
        />
        
        {/* Inner spinning ring */}
        <div 
          className="absolute inset-8 rounded-full border-4 border-primary/30 border-t-primary"
          style={{ transform: `rotate(${rotation * 2}deg)` }}
        />
        
        {/* Core with pulsing effect */}
        <div className="absolute inset-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
          <PulsingDot />
        </div>
        
        {/* Orbiting particles */}
        <OrbitingParticles rotation={rotation} />
      </div>
    </div>
  );
} 