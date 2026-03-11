import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoMessageProps {
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  videoUrl?: string; // Optional real video URL
  duration?: number;
}

export function VideoMessage({ isMe, status, videoUrl, duration }: VideoMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const isSending = status === 'sending';
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const totalSeconds = duration || 12;

  const togglePlayback = () => {
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      videoRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  // Simulation interval for mock videos (when videoUrl is empty)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !videoUrl) {
      const step = 100 / (totalSeconds * 10);
      interval = setInterval(() => {
        setProgress(p => {
          if (p + step >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoUrl, totalSeconds]);

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
          loop={false}
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
          }}
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
      
      {/* Circular Progress Ring */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transform -rotate-90">
        <circle 
          cx="96" cy="96" r="94" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          className={cn("text-primary transition-all duration-100", progress > 0 ? "opacity-100" : "opacity-0")}
          strokeDasharray="590.6"
          strokeDashoffset={590.6 - (590.6 * progress) / 100}
        />
      </svg>
      
      {/* Duration stamp */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2 py-0.5 rounded px-2 bg-black/50 text-white backdrop-blur-md opacity-80">
        {isPlaying 
           ? `0:${Math.floor((progress / 100) * totalSeconds).toString().padStart(2, '0')}` 
           : `0:${Math.floor(totalSeconds).toString().padStart(2, '0')}`
        }
      </div>
    </div>
  );
}
