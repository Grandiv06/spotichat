import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderUIProps {
  onCancel: () => void;
  onSend: (blob?: Blob) => void;
  isLocked?: boolean;
  stream?: MediaStream | null;
}

export function VoiceRecorderUI({ onCancel, isLocked, stream }: VoiceRecorderUIProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(15).fill(10));
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Audio Visualizer
  useEffect(() => {
    if (!stream) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioCtx;
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Sample 15 distinct bands roughly across speech frequencies
      const newLevels = [];
      const step = Math.floor(dataArray.length / 15) || 1;
      
      for (let i = 0; i < 15; i++) {
        const amplitude = dataArray[i * step] || 0;
        // Normalize 0-255 to roughly 10-100% height
        const heightPercent = Math.max(10, Math.min(100, (amplitude / 255) * 100 + 10));
        newLevels.push(heightPercent);
      }
      
      setLevels(newLevels);
      animationRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
      }
    };
  }, [stream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 rounded-2xl min-h-[44px] flex items-center px-1 border-transparent animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Cancel Button */}
      {(isLocked || !stream) && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-10 w-10 flex-shrink-0"
          onClick={onCancel}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      )}
      
      {/* Slide to cancel hint if NOT locked */}
      {!isLocked && stream && (
         <div className="text-xs text-muted-foreground animate-pulse mr-auto ml-2">
           {"< Slide to cancel"}
         </div>
      )}

      {/* Recording Indicator & Timer */}
      <div className="flex-1 flex items-center justify-end gap-3 mr-2">
        <div className="flex items-center gap-2">
          {/* Pulsing Red Dot */}
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <span className="text-sm font-medium tabular-nums w-10">{formatTime(recordingTime)}</span>
        </div>
        
        {/* Live Audio Waveform */}
        <div className="hidden sm:flex items-center gap-[2px] h-6 opacity-70">
           {levels.map((height, i) => (
              <div 
                key={i} 
                className="w-1 bg-primary/70 rounded-full transition-all duration-75 ease-out" 
                style={{ height: `${height}%` }} 
              />
           ))}
        </div>
      </div>
    </div>
  );
}
