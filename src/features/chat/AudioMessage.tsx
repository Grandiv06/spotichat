import { useState, useEffect, useMemo, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AudioMessageProps {
  isMe: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  duration?: number;
  audioUrl?: string;
  messageId: string;
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

function buildWaveform(seed: number, bars = 34): number[] {
  let cursor = seed || 1;
  return Array.from({ length: bars }).map(() => {
    cursor = (cursor * 1664525 + 1013904223) % 0x100000000;
    return 28 + (cursor / 0x100000000) * 72;
  });
}

function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioMessage({ isMe, status, duration, audioUrl, messageId }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [metadataDuration, setMetadataDuration] = useState<number | null>(null);
  const isSending = status === 'sending';
  const audioRef = useRef<HTMLAudioElement>(null);
  const totalSeconds = Math.max(1, metadataDuration ?? duration ?? 12);

  const waveformHeights = useMemo(() => buildWaveform(hashSeed(messageId)), [messageId]);

  // Simulation logic for play/pause progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && !audioUrl) {
      const step = 100 / (totalSeconds * 10); // How much to add every 100ms
      interval = setInterval(() => {
        setProgress(p => {
          if (p + step >= 100) {
            setIsPlaying(false);
            setElapsedSeconds(0);
            return 0;
          }
          setElapsedSeconds(((p + step) / 100) * totalSeconds);
          return p + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [audioUrl, isPlaying, totalSeconds]);

  useEffect(() => {
    const audioElement = audioRef.current;
    return () => {
      audioElement?.pause();
    };
  }, []);

  const handleControlPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const syncAudioProgress = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const current = audio.currentTime;
    const total = audio.duration;
    setElapsedSeconds(current);
    setMetadataDuration(total);
    setProgress((current / total) * 100);
  };

  const togglePlayback = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSending) return;

    if (!audioUrl) {
      setIsPlaying((prev) => !prev);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 w-[14.5rem] max-w-[72vw] sm:w-64 py-1",
        isMe ? "text-primary-foreground" : "text-card-foreground",
      )}
    >
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={syncAudioProgress}
          onTimeUpdate={syncAudioProgress}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
            setElapsedSeconds(0);
          }}
        />
      ) : null}

      <Button 
        data-media-control="true"
        variant="ghost" 
        size="icon" 
        disabled={isSending}
        className={cn(
          "h-9 w-9 shrink-0 rounded-full",
          isMe ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90 disabled:opacity-70" : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        )}
        onPointerDown={handleControlPointerDown}
        onClick={togglePlayback}
      >
        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
      </Button>
      
      <div className="flex flex-col flex-1 gap-1 min-w-0 overflow-hidden">
        <div
          className={cn(
            "flex items-end h-6 w-full gap-[2px] transition-opacity",
            isSending ? "opacity-30" : "opacity-80",
          )}
        >
          {waveformHeights.map((height, i) => {
            const isActive = (i / waveformHeights.length) * 100 <= progress;
            return (
              <div 
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-100",
                  isActive ? "bg-current opacity-100" : "bg-current opacity-30"
                )}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>
        <div className="flex justify-between items-center mt-0.5">
           <span className="text-[11px] tabular-nums font-medium opacity-80">
             {formatDuration(isPlaying ? elapsedSeconds : (progress / 100) * totalSeconds)}
           </span>
           <span className="text-[11px] tabular-nums opacity-70">
             {formatDuration(totalSeconds)}
           </span>
        </div>
      </div>
    </div>
  );
}
