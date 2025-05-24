
import * as THREE from 'three';
import { Analyser } from '@/utils/audioAnalyser';

// Helper functions for Three.js scene initialization and animations
export const createScene = (): THREE.Scene => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xE0F0FF);  // Light blue background
  return scene;
};

export const createCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  camera.position.set(2, -2, 5);
  return camera;
};

export const createRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  return renderer;
};

export const createLights = (scene: THREE.Scene): void => {
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040);
  scene.add(ambientLight);
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
};

export const createBackdrop = (
  vertexShader: string, 
  fragmentShader: string
): THREE.Mesh => {
  const backdrop = new THREE.Mesh(
    new THREE.IcosahedronGeometry(10, 5),
    new THREE.ShaderMaterial({
      uniforms: {
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        rand: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      side: THREE.BackSide
    })
  );
  
  return backdrop;
};

export const createSphere = (vertexShader: string): THREE.Mesh => {
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
    shader.vertexShader = vertexShader;
  };
  
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
};

export const handleResize = (
  camera: THREE.PerspectiveCamera, 
  renderer: THREE.WebGLRenderer,
  backdrop?: THREE.Mesh
): void => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  
  if (backdrop?.material instanceof THREE.ShaderMaterial) {
    backdrop.material.uniforms.resolution.value.set(
      width * window.devicePixelRatio,
      height * window.devicePixelRatio
    );
  }
};

export const updateScene = (
  time: number,
  prevTime: number,
  sphere: THREE.Mesh,
  backdrop: THREE.Mesh,
  rotation: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  inputAnalyser?: Analyser | null,
  outputAnalyser?: Analyser | null
): number => {
  // Update audio analysers
  if (inputAnalyser) inputAnalyser.update();
  if (outputAnalyser) outputAnalyser.update();
  
  // Calculate time delta for smooth animations
  const dt = (time - prevTime) / (1000 / 60); // Target 60 FPS
  
  // Update backdrop shader
  if (backdrop.material instanceof THREE.ShaderMaterial) {
    backdrop.material.uniforms.rand.value = Math.random() * 10000;
  }
  
  // Update sphere based on audio data
  const material = sphere.material as THREE.MeshStandardMaterial;
  
  if (material.userData?.shader) {
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
  
  return time;
};
