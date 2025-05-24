
/**
 * GLSL vertex shader for the reactive sphere
 */

export const vs = `
precision highp float;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float time;
uniform vec4 inputData;
uniform vec4 outputData;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

// Simple noise function
float noise(vec3 p) {
  return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
}

void main() {
  vUv = uv;
  
  // Compute time-based offset
  float t = time * 0.5;
  
  // Create dynamic deformation based on audio input and output
  float deformation = sin(position.x * 10.0 + t) * inputData.x * 0.3;
  deformation += cos(position.y * 8.0 - t) * outputData.x * 0.4;
  deformation += sin(position.z * 12.0 + t * 0.7) * mix(inputData.y, outputData.y, 0.5) * 0.5;
  
  // Apply deformation along normal
  vec3 newPosition = position + normal * deformation;
  
  // Compute final position and normal
  vPosition = newPosition;
  vNormal = normalize(normal + vec3(deformation * 0.2));
  
  // Output transformed position
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;
