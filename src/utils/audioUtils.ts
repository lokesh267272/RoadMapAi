
/**
 * Utility functions for audio processing in the AI Voice Agent
 */

// Decode base64 audio data
export const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Create a blob from PCM data for sending to the API
export const createBlob = (pcmData: Float32Array): Blob => {
  const int16Array = new Int16Array(pcmData.length);
  
  // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Create a new Blob with the Int16Array data
  return new Blob([int16Array.buffer], { type: 'audio/pcm;rate=16000' });
};

// Decode audio data for playback
export const decodeAudioData = async (
  data: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> => {
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      data.buffer,
      (buffer) => resolve(buffer),
      (error) => reject(error)
    );
  });
};
