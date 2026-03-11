import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
}

export function AudioMessage({ isMe, status }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const isSending = status === 'sending';

  const waveformHeights = useMemo(() => Array.from({ length: 30 }).map(() => Math.max(20, Math.random() * 100)), []);

  // Simulation logic for play/pause progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 2;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-3 w-48 sm:w-64 pt-1 pb-1">
      <Button 
        variant="ghost" 
        size="icon" 
        disabled={isSending}
        className={cn(
          "h-10 w-10 shrink-0 rounded-full",
          isMe ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:opacity-70" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        )}
        onClick={() => setIsPlaying(!isPlaying)}
      >
        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
      </Button>
      
      <div className="flex flex-col flex-1 gap-1 w-full overflow-hidden">
        {/* Mock Waveform */}
        <div className={cn("flex items-end h-5 w-full gap-[2px] transition-opacity", isSending ? "opacity-30" : "opacity-80")}>
          {waveformHeights.map((height, i) => {
            const isActive = (i / 30) * 100 <= progress;
            return (
              <div 
                key={i}
                className={cn(
                  "w-1 rounded-full transition-all duration-75",
                  isActive ? "bg-current opacity-100" : "bg-current opacity-30"
                )}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-1">
           <span className="text-[11px] tabular-nums font-medium opacity-80">
             {isPlaying ? `0:${Math.floor((progress * 0.12)).toString().padStart(2, '0')}` : '0:12'}
           </span>
        </div>
      </div>
    </div>
  );
}
