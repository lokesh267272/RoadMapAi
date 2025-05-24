
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, RefreshCw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Define AudioContext type to handle cross-browser compatibility
type AudioContextType = typeof AudioContext;

// Safe access to AudioContext constructor, with fallback for older browsers
const AudioContextClass: AudioContextType = 
  window.AudioContext || 
  (window as any).webkitAudioContext;

const AiVoiceAgent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("Ready to start");
  const [error, setError] = useState("");
  
  // Audio contexts and nodes
  const inputAudioContextRef = useRef<AudioContext>();
  const outputAudioContextRef = useRef<AudioContext>();
  const inputNodeRef = useRef<GainNode>();
  const outputNodeRef = useRef<GainNode>();
  
  // Session and stream references
  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Audio playback references
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Canvas and visualization references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio contexts and setup
  useEffect(() => {
    // Initialize audio contexts
    try {
      inputAudioContextRef.current = new AudioContextClass({
        sampleRate: 16000
      });
      outputAudioContextRef.current = new AudioContextClass({
        sampleRate: 24000
      });
      
      // Create gain nodes
      inputNodeRef.current = inputAudioContextRef.current.createGain();
      outputNodeRef.current = outputAudioContextRef.current.createGain();
      
      // Connect output node to destination
      outputNodeRef.current.connect(outputAudioContextRef.current.destination);
      
      // Initialize next start time
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
      
      // Start visualization
      startVisualization();
    } catch (err) {
      console.error("Error initializing audio contexts:", err);
      setError("Failed to initialize audio. Please ensure your browser supports Web Audio API.");
    }
    
    // Clean up on component unmount
    return () => {
      stopRecording();
      closeWebSocket();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

  // Utility function for creating a blob from PCM data
  const createBlob = (pcmData: Float32Array) => {
    const int16Array = new Int16Array(pcmData.length);
    
    // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
    for (let i = 0; i < pcmData.length; i++) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Create a new Blob with the Int16Array data
    return new Blob([int16Array.buffer], { type: 'audio/pcm;rate=16000' });
  };

  // Utility function for decoding base64 audio data
  const decode = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  // Utility function for decoding audio data
  const decodeAudioData = async (
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

  const startVisualization = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Make sure canvas is full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Animation function
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Get center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Base circle radius
      const radius = Math.min(canvas.width, canvas.height) / 4;
      
      // Draw input audio visualization (outer ring)
      ctx.beginPath();
      ctx.strokeStyle = '#5AB0FF'; // Neon blue
      ctx.lineWidth = 3;
      
      for (let i = 0; i < 32; i++) {
        // Simplified visualization without audio analysis
        const amplitude = isRecording ? (Math.sin(Date.now() / 200 + i * 0.2) + 1) * 0.5 : 0.1;
        const angle = (i / 32) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * (radius + amplitude * 100);
        const y = centerY + Math.sin(angle) * (radius + amplitude * 100);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.stroke();
      
      // Draw center circle
      ctx.beginPath();
      ctx.fillStyle = isRecording ? '#FF4444' : '#9145B6'; // Red when recording, purple when not
      ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
      ctx.fill();
    };
    
    animate();
  };

  // Initialize WebSocket connection to our Supabase Edge Function
  const initWebSocket = () => {
    if (wsRef.current) {
      closeWebSocket();
    }

    try {
      // Connect to Supabase Edge Function WebSocket
      const wsUrl = `wss://wxmkwxulnbcoidpfmicw.functions.supabase.co/voice-agent-realtime`;
      wsRef.current = new WebSocket(wsUrl);
      
      // WebSocket event handlers
      wsRef.current.onopen = () => {
        setStatus("Connected to voice agent");
        console.log("WebSocket connection established");
      };
      
      wsRef.current.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Received message:", message.type);
          
          if (message.type === 'session.created') {
            setStatus("Session created. Ready to start");
            
            // Send session configuration after session is created
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: 'session.update',
                session: {
                  modalities: ["text", "audio"],
                  instructions: "You are a helpful AI assistant having a voice conversation. Your knowledge cutoff is 2023.",
                  voice: "alloy",
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                    model: "whisper-1"
                  },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1000
                  }
                }
              }));
            }
          } 
          else if (message.type === 'response.audio.delta') {
            // Process incoming audio data
            if (message.delta && outputAudioContextRef.current) {
              const audioData = decode(message.delta);
              
              // Get next start time
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputAudioContextRef.current.currentTime
              );
              
              try {
                // Decode the audio data
                const audioBuffer = await decodeAudioData(
                  audioData,
                  outputAudioContextRef.current,
                  24000,
                  1
                );
                
                // Create and connect source
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputNodeRef.current!);
                
                // Add to sources set and remove when ended
                sourcesRef.current.add(source);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                });
                
                // Start audio playback
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              } catch (err) {
                console.error("Error decoding audio:", err);
              }
            }
          }
          else if (message.type === 'response.audio.done') {
            setStatus("AI response complete");
          }
          else if (message.error) {
            console.error("WebSocket error:", message.error);
            setError(`Error: ${message.error}`);
          }
        } catch (err) {
          console.error("Error processing WebSocket message:", err);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Connection error. Please try again.");
      };
      
      wsRef.current.onclose = () => {
        console.log("WebSocket connection closed");
        setStatus("Connection closed");
      };
    } catch (err) {
      console.error("Error initializing WebSocket:", err);
      setError(`Failed to connect: ${err.message}`);
    }
  };

  // Close WebSocket connection
  const closeWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Start recording
  const startRecording = async () => {
    if (isRecording) return;
    
    try {
      if (!inputAudioContextRef.current) {
        throw new Error("Audio context not initialized");
      }
      
      // Initialize WebSocket if not already connected
      if (!wsRef.current) {
        initWebSocket();
      } else if (wsRef.current.readyState !== WebSocket.OPEN) {
        closeWebSocket();
        initWebSocket();
      }
      
      // Resume audio context (required by browsers)
      await inputAudioContextRef.current.resume();
      
      setStatus("Requesting microphone access...");
      setError("");
      
      // Get microphone access
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      
      setStatus("Microphone access granted. Recording...");
      
      // Create source node from microphone stream
      sourceNodeRef.current = inputAudioContextRef.current.createMediaStreamSource(
        mediaStreamRef.current
      );
      sourceNodeRef.current.connect(inputNodeRef.current!);
      
      // Create script processor to handle audio data
      const bufferSize = 256;
      scriptProcessorNodeRef.current = inputAudioContextRef.current.createScriptProcessor(
        bufferSize, 1, 1
      );
      
      // Process audio data
      scriptProcessorNodeRef.current.onaudioprocess = (audioProcessingEvent) => {
        if (!isRecording || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const pcmData = inputBuffer.getChannelData(0);
        
        // Send audio data to WebSocket
        try {
          // Convert PCM data to blob and send to WebSocket
          const blob = createBlob(pcmData);
          
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = () => {
            try {
              const base64data = reader.result as string;
              const base64Content = base64data.split(',')[1];
              
              wsRef.current?.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Content
              }));
            } catch (err) {
              console.error("Error sending audio data:", err);
            }
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Error processing audio data:", err);
        }
      };
      
      sourceNodeRef.current.connect(scriptProcessorNodeRef.current);
      scriptProcessorNodeRef.current.connect(inputAudioContextRef.current.destination);
      
      setIsRecording(true);
      toast.success("Recording started");
    } catch (err: any) {
      console.error("Error starting recording:", err);
      setError(`Error: ${err.message}`);
      setStatus("Failed to start recording");
      stopRecording();
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!isRecording && !mediaStreamRef.current) return;
    
    setStatus("Stopping recording...");
    setIsRecording(false);
    
    // Disconnect and clean up audio nodes
    if (scriptProcessorNodeRef.current && sourceNodeRef.current) {
      scriptProcessorNodeRef.current.disconnect();
      sourceNodeRef.current.disconnect();
    }
    
    scriptProcessorNodeRef.current = null;
    sourceNodeRef.current = null;
    
    // Stop all media tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Send message to complete the request
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'response.create'
      }));
      setStatus("Generating AI response...");
    }
    
    toast.success("Recording stopped");
  };

  // Reset the session
  const resetSession = () => {
    // Stop any playing audio
    for (const source of sourcesRef.current.values()) {
      source.stop();
      sourcesRef.current.delete(source);
    }
    
    // Reset next start time
    if (outputAudioContextRef.current) {
      nextStartTimeRef.current = outputAudioContextRef.current.currentTime;
    }
    
    // Close and reinitialize WebSocket
    closeWebSocket();
    initWebSocket();
    
    setStatus("Session reset. Ready to start.");
    toast.success("Session reset");
  };

  // Stop playing audio
  const stopPlayback = () => {
    for (const source of sourcesRef.current.values()) {
      source.stop();
      sourcesRef.current.delete(source);
    }
    
    setStatus("Audio playback stopped");
    toast.success("Playback stopped");
  };

  // Render UI
  return (
    <div className="relative min-h-screen pt-16 pb-10 flex flex-col">
      {/* Background canvas for visualizations */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full z-0"
      />
      
      <div className="container mx-auto px-4 flex-1 flex flex-col items-center justify-center relative z-10">
        <Card className="w-full max-w-xl bg-glass shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gradient">
              AI Voice Agent
            </CardTitle>
            <p className="text-muted-foreground">
              Have a conversation with an AI assistant using your voice
            </p>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center gap-8 pb-8">
            {/* Status display */}
            <div className="w-full bg-secondary/50 p-4 rounded-lg text-center">
              {error ? (
                <p className="text-destructive">{error}</p>
              ) : (
                <p className="text-primary font-semibold">{status}</p>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-center gap-6">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 bg-secondary/50 border-primary hover:bg-primary/20"
                onClick={resetSession}
                disabled={isRecording}
                title="Reset Session"
              >
                <RefreshCw className="h-8 w-8 text-primary" />
                <span className="sr-only">Reset Session</span>
              </Button>
              
              <Button
                size="lg"
                className={`rounded-full w-20 h-20 ${
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-primary hover:bg-primary/90"
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                title={isRecording ? "Stop Recording" : "Start Recording"}
              >
                {isRecording ? (
                  <Square className="h-10 w-10" />
                ) : (
                  <Mic className="h-10 w-10" />
                )}
                <span className="sr-only">
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </span>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="rounded-full w-16 h-16 bg-secondary/50 border-primary hover:bg-primary/20"
                onClick={stopPlayback}
                disabled={isRecording}
                title="Stop Playback"
              >
                <Volume2 className="h-8 w-8 text-primary" />
                <span className="sr-only">Stop Playback</span>
              </Button>
            </div>
            
            <div className="text-sm text-center text-muted-foreground mt-4">
              <p>Click the microphone button to start talking to the AI.</p>
              <p>The AI will respond with audio after you finish speaking.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AiVoiceAgent;
