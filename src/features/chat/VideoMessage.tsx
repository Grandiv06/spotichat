import { useState, useRef } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoMessageProps {
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  videoUrl?: string; // Optional placeholder video URL
}

export function VideoMessage({ isMe, status, videoUrl }: VideoMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isSending = status === 'sending';
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={cn(
      "relative w-48 h-48 rounded-full overflow-hidden flex items-center justify-center shrink-0 group transition-opacity", 
      isMe ? "bg-primary-foreground/20" : "bg-black/10",
      isSending ? "opacity-70" : "opacity-100"
    )}>
      {videoUrl ? (
        <video 
          ref={videoRef}
          src={videoUrl} 
          className="w-full h-full object-cover transform -scale-x-100"
          loop
          playsInline
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full bg-black/80 flex items-center justify-center text-[10px] text-white/50 text-center px-4">
          {/* Simulated empty video feed */}
          <div className="animate-pulse bg-white/10 w-full h-full rounded-full" />
        </div>
      )}

      {/* Overlay controls */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-colors cursor-pointer",
          isPlaying ? "bg-transparent hover:bg-black/20" : "bg-black/20 hover:bg-black/30"
        )} 
        onClick={togglePlayback}
      >
        {isSending ? (
          <Loader2 className="h-8 w-8 text-white animate-spin drop-shadow-md" />
        ) : isPlaying ? (
          <Pause className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
        ) : (
          <Play className="h-10 w-10 text-white drop-shadow-md ml-1 opacity-90 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      
      {/* Duration stamp */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded px-2 bg-black/50 text-white backdrop-blur-md opacity-80">
        0:12
      </div>
    </div>
  );
}
