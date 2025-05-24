
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Analyser } from '@/utils/audioAnalyser';
import { vs as backdropVS, fs as backdropFS } from '@/utils/shaders/backdropShader';
import { vs as sphereVS } from '@/utils/shaders/sphereShader';
import {
  createScene,
  createCamera,
  createRenderer,
  createLights,
  createBackdrop,
  createSphere,
  handleResize,
  updateScene
} from '@/utils/threeHelpers';

interface VoiceVisualizerProps {
  inputNode?: GainNode | null;
  outputNode?: GainNode | null;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ inputNode, outputNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize variables
    let inputAnalyser: Analyser | null = null;
    let outputAnalyser: Analyser | null = null;
    let rotation = new THREE.Vector3(0, 0, 0);
    let prevTime = 0;
    let animationFrameId: number;
    
    // Initialize THREE.js components
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvasRef.current);
    
    // Create elements
    createLights(scene);
    const backdrop = createBackdrop(backdropVS, backdropFS);
    scene.add(backdrop);
    
    const sphere = createSphere(sphereVS);
    scene.add(sphere);
    
    // Initialize audio analysers if nodes exist
    if (inputNode) inputAnalyser = new Analyser(inputNode);
    if (outputNode) outputAnalyser = new Analyser(outputNode);
    
    // Handle window resize
    const resizeHandler = () => handleResize(camera, renderer, backdrop);
    window.addEventListener('resize', resizeHandler);
    
    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const time = performance.now();
      prevTime = updateScene(
        time, 
        prevTime, 
        sphere, 
        backdrop, 
        rotation, 
        camera, 
        inputAnalyser, 
        outputAnalyser
      );
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    // Start animation loop
    animate();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeHandler);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [inputNode, outputNode]);
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default VoiceVisualizer;
