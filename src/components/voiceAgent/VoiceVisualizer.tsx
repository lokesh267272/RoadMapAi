
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Analyser } from '@/utils/audioAnalyser';
import { vs as backdropVS, fs as backdropFS } from '@/utils/shaders/backdropShader';
import { vs as sphereVS } from '@/utils/shaders/sphereShader';

interface VoiceVisualizerProps {
  inputNode?: GainNode | null;
  outputNode?: GainNode | null;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ inputNode, outputNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize variables to be used in the animation
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let backdrop: THREE.Mesh;
    let sphere: THREE.Mesh;
    let inputAnalyser: Analyser | null = null;
    let outputAnalyser: Analyser | null = null;
    let rotation = new THREE.Vector3(0, 0, 0);
    let prevTime = 0;
    let animationFrameId: number;
    
    // Initialize THREE.js scene
    const init = () => {
      // Create scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xE0F0FF);  // Light blue background
      
      // Create camera
      camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near clipping plane
        1000 // Far clipping plane
      );
      camera.position.set(2, -2, 5);
      
      // Create renderer
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true // Enable anti-aliasing
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      
      // Create backdrop sphere (inside-out icosahedron)
      backdrop = new THREE.Mesh(
        new THREE.IcosahedronGeometry(10, 5),
        new THREE.ShaderMaterial({
          uniforms: {
            resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
            rand: { value: 0 }
          },
          vertexShader: backdropVS,
          fragmentShader: backdropFS,
          side: THREE.BackSide
        })
      );
      scene.add(backdrop);
      
      // Create reactive sphere
      const geometry = new THREE.IcosahedronGeometry(1, 10);
      const material = new THREE.MeshStandardMaterial({
        color: 0x60A0FF, // Medium blue
        metalness: 0.6,
        roughness: 0.2,
        emissive: 0x80C0FF, // Lighter blue emissive
        emissiveIntensity: 1.0,
      });
      
      // Add custom shader to material
      material.onBeforeCompile = (shader) => {
        shader.uniforms.time = { value: 0 };
        shader.uniforms.inputData = { value: new THREE.Vector4() };
        shader.uniforms.outputData = { value: new THREE.Vector4() };
        material.userData.shader = shader;
        shader.vertexShader = sphereVS;
      };
      
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);
      
      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Initialize audio analysers if nodes exist
      if (inputNode) inputAnalyser = new Analyser(inputNode);
      if (outputNode) outputAnalyser = new Analyser(outputNode);
      
      // Handle window resize
      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        
        if (backdrop.material instanceof THREE.ShaderMaterial) {
          backdrop.material.uniforms.resolution.value.set(
            width * window.devicePixelRatio,
            height * window.devicePixelRatio
          );
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Start animation loop
      animate();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
      };
    };
    
    // Animation loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Update audio analysers
      if (inputAnalyser) inputAnalyser.update();
      if (outputAnalyser) outputAnalyser.update();
      
      // Calculate time delta for smooth animations
      const time = performance.now();
      const dt = (time - prevTime) / (1000 / 60); // Target 60 FPS
      prevTime = time;
      
      // Update backdrop shader
      if (backdrop.material instanceof THREE.ShaderMaterial) {
        backdrop.material.uniforms.rand.value = Math.random() * 10000;
      }
      
      // Update sphere based on audio data
      const material = sphere.material as THREE.MeshStandardMaterial;
      
      if (material.userData.shader) {
        // Scale sphere based on output audio (if available)
        sphere.scale.setScalar(
          1 + (outputAnalyser ? 0.2 * (outputAnalyser.data[1] / 255) : 0)
        );
        
        // Rotate camera based on audio
        const f = 0.001;
        if (outputAnalyser) {
          rotation.x += dt * f * 0.5 * (outputAnalyser.data[1] / 255);
          rotation.y += dt * f * 0.25 * (outputAnalyser.data[2] / 255);
        }
        if (inputAnalyser) {
          rotation.z += dt * f * 0.5 * (inputAnalyser.data[1] / 255);
          rotation.y += dt * f * 0.25 * (inputAnalyser.data[2] / 255);
        }
        
        // Apply rotation to camera position
        const euler = new THREE.Euler(rotation.x, rotation.y, rotation.z);
        const quaternion = new THREE.Quaternion().setFromEuler(euler);
        const vector = new THREE.Vector3(0, 0, 5);
        vector.applyQuaternion(quaternion);
        camera.position.copy(vector);
        camera.lookAt(sphere.position);
        
        // Update shader uniforms with audio data
        const shader = material.userData.shader;
        shader.uniforms.time.value += dt * 0.01 * (outputAnalyser ? (outputAnalyser.data[0] / 255) : 0.1);
        
        // Input data
        shader.uniforms.inputData.value.set(
          inputAnalyser ? (inputAnalyser.data[0] / 255) : 0,
          inputAnalyser ? (0.1 * inputAnalyser.data[1] / 255) : 0,
          inputAnalyser ? (10 * inputAnalyser.data[2] / 255) : 0,
          0
        );
        
        // Output data
        shader.uniforms.outputData.value.set(
          outputAnalyser ? (2 * outputAnalyser.data[0] / 255) : 0,
          outputAnalyser ? (0.1 * outputAnalyser.data[1] / 255) : 0,
          outputAnalyser ? (10 * outputAnalyser.data[2] / 255) : 0,
          0
        );
      }
      
      // Render the scene
      renderer.render(scene, camera);
    };
    
    // Initialize the visualization
    const cleanup = init();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [inputNode, outputNode]);
  
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default VoiceVisualizer;
