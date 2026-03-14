import { useState, useRef, useEffect } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { Play, Pause, Loader2, VideoOff } from 'lucide-react';
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [metadataDuration, setMetadataDuration] = useState<number | null>(null);
  const isSending = status === 'sending';
  const videoRef = useRef<HTMLVideoElement>(null);
  const totalSeconds = Math.max(1, metadataDuration ?? duration ?? 12);

  const stopEvent = (
    event: MouseEvent<HTMLElement> | PointerEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
  };

  const handleControlPointerDown = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const syncVideoProgress = () => {
    if (!videoRef.current || !videoRef.current.duration) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setElapsedSeconds(current);
    setMetadataDuration(total);
    setProgress((current / total) * 100);
  };

  const togglePlayback = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSending) return;

    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (videoRef.current) {
      void videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
      return;
    }

    if (!videoUrl) {
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const safe = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            setElapsedSeconds(0);
            return 0;
          }
          setElapsedSeconds(((p + step) / 100) * totalSeconds);
          return p + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, videoUrl, totalSeconds]);

  return (
    <div
      data-media-control="true"
      className="relative isolate h-40 w-40 sm:h-44 sm:w-44 shrink-0"
      onPointerDown={stopEvent}
      onClick={stopEvent}
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-full border shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
          isMe
            ? "border-primary-foreground/30 bg-primary-foreground/8"
            : "border-border/70 bg-muted/20",
          isSending ? "opacity-75" : "opacity-100",
        )}
      >
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="h-full w-full object-cover"
            loop={false}
            preload="metadata"
            playsInline
            onLoadedMetadata={syncVideoProgress}
            onTimeUpdate={syncVideoProgress}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onEnded={() => {
              setIsPlaying(false);
              setProgress(0);
              setElapsedSeconds(0);
            }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black flex items-center justify-center">
            <VideoOff className="h-7 w-7 text-white/55" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/35" />

        <button
          type="button"
          onPointerDown={handleControlPointerDown}
          onClick={togglePlayback}
          className={cn(
            "absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "bg-black/55 text-white backdrop-blur-md border border-white/18",
            "flex items-center justify-center transition-all duration-150",
            "hover:scale-105 active:scale-95",
          )}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/58 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/95 backdrop-blur-sm">
          {formatDuration(isPlaying ? elapsedSeconds : (progress / 100) * totalSeconds || totalSeconds)}
        </div>

        {isSending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/26">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>
        )}
      </div>

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-white/18"
        />
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.5"
          className={cn(
            "transition-[stroke-dashoffset,opacity] duration-150",
            isMe ? "text-primary-foreground/85" : "text-primary/85",
            progress > 0 ? "opacity-100" : "opacity-0",
          )}
          pathLength={100}
          strokeDasharray={100}
          strokeDashoffset={100 - progress}
        />
      </svg>
    </div>
  );
}
