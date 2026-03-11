import { useState, useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoRecorderUIProps {
  onCancel: () => void;
  onSend: (blob?: Blob) => void;
  isLocked?: boolean;
  stream?: MediaStream | null;
}

export function VideoRecorderUI({ onCancel, isLocked, stream }: VideoRecorderUIProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between w-full h-full">
      {/* Floating Circular Video Preview */}
      <div className="fixed sm:absolute sm:bottom-20 sm:right-4 bottom-24 right-4 w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-2xl animate-in fade-in zoom-in duration-300 z-50 bg-black">
        <video 
          ref={videoRef}
          autoPlay 
          muted 
          playsInline
          className="w-full h-full object-cover transform -scale-x-100"
        />
      </div>

      {/* Bottom Bar Controls */}
      <div className="flex-1 rounded-2xl flex items-center px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
        
        {!isLocked && stream && (
           <div className="text-xs text-muted-foreground animate-pulse mr-auto ml-2">
             {"< Slide to cancel"}
           </div>
        )}

        <div className="flex-1 flex items-center justify-end gap-3 mr-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <span className="text-sm font-medium tabular-nums w-10 text-right">{formatTime(recordingTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
