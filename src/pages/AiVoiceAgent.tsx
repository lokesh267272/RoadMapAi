
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Square, RefreshCw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import VoiceVisualizer from "@/components/voiceAgent/VoiceVisualizer";
import { createBlob, decode, decodeAudioData } from "@/utils/audioUtils";

// Define AudioContext type to handle cross-browser compatibility
type AudioContextType = typeof AudioContext;

// Safe access to AudioContext constructor, with fallback for older browsers
const AudioContextClass: AudioContextType = window.AudioContext || 
  (window as any).webkitAudioContext;

type GeminiMessage = {
  serverContent?: {
    modelTurn?: {
      parts?: {
        inlineData?: {
          data: string;
        }
      }[]
    },
    interrupted?: boolean;
  };
};

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
    } catch (err) {
      console.error("Error initializing audio contexts:", err);
      setError("Failed to initialize audio. Please ensure your browser supports Web Audio API.");
    }
    
    // Clean up on component unmount
    return () => {
      stopRecording();
      closeWebSocket();
      
      inputAudioContextRef.current?.close();
      outputAudioContextRef.current?.close();
    };
  }, []);

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
          const message: GeminiMessage = JSON.parse(event.data);
          console.log("Received message type:", message);
          
          // Handle audio data
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData;
          if (audio && outputAudioContextRef.current) {
            // Process incoming audio data
            nextStartTimeRef.current = Math.max(
              nextStartTimeRef.current,
              outputAudioContextRef.current.currentTime
            );
            
            try {
              // Decode the audio data
              const audioData = decode(audio.data);
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
          
          // Handle interrupted state
          const interrupted = message.serverContent?.interrupted;
          if (interrupted) {
            for (const source of sourcesRef.current.values()) {
              source.stop();
              sourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = outputAudioContextRef.current?.currentTime || 0;
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
    } catch (err: any) {
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
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
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
        
        // Send audio data to WebSocket - for Gemini API
        try {
          wsRef.current.send(JSON.stringify({
            media: createBlob(pcmData)
          }));
        } catch (err) {
          console.error("Error sending audio data:", err);
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
    
    setStatus("Recording stopped");
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
      {/* 3D visualization */}
      <VoiceVisualizer 
        inputNode={inputNodeRef.current}
        outputNode={outputNodeRef.current}
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
