import { useState, useEffect } from "react";
import { Trash2, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderUIProps {
  onCancel: () => void;
  onSend: (blob?: Blob) => void;
}

export function VoiceRecorderUI({ onCancel, onSend }: VoiceRecorderUIProps) {
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 bg-accent/30 rounded-2xl min-h-[44px] flex items-center px-2 py-1 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Cancel Button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-10 w-10 flex-shrink-0"
        onClick={onCancel}
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      {/* Recording Indicator & Timer */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2">
          {/* Pulsing Red Dot */}
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <span className="text-sm font-medium tabular-nums">{formatTime(recordingTime)}</span>
        </div>
        
        {/* Mock Waveform */}
        <div className="hidden sm:flex items-center gap-[2px] h-6 opacity-70">
           {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className="w-1 bg-primary/60 rounded-full animate-pulse" 
                style={{ 
                  height: `${Math.max(20, Math.random() * 100)}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s'
                }} 
              />
           ))}
        </div>
      </div>

      {/* Send Mechanism */}
      <Button
        onClick={() => onSend()}
        size="icon"
        className="bg-primary text-primary-foreground h-10 w-10 flex-shrink-0 rounded-full shadow-sm hover:brightness-110 ml-1"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
