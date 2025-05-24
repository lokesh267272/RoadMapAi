
/**
 * GLSL shaders for the backdrop
 */

// Vertex shader
export const vs = `#version 300 es
precision highp float;
in vec3 position;
in vec2 uv;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`;

// Fragment shader
export const fs = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform float rand;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec2 pos = gl_FragCoord.xy / resolution.xy;
  float n = noise(pos * rand);
  
  // Create a gradient from top to bottom
  vec3 topColor = vec3(0.9, 0.95, 1.0);  // Light blue at the top
  vec3 bottomColor = vec3(0.6, 0.8, 0.95);  // Darker blue at the bottom
  vec3 gradientColor = mix(bottomColor, topColor, pos.y);
  
  // Add some subtle noise
  gradientColor += vec3(n * 0.02);
  
  fragColor = vec4(gradientColor, 1.0);
}
`;
