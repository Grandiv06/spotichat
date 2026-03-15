import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PlaybackSpeed = 1 | 1.5 | 2;

interface VideoMessageProps {
  isMe: boolean;
  status?: "sending" | "sent" | "delivered" | "seen";
  videoUrl?: string;
  duration?: number;
  isActive: boolean;
  isGlobalPlaying: boolean;
  playbackSpeed: PlaybackSpeed;
  onRequestPlay: () => void;
  onTogglePlayPause: () => void;
  onProgress: (payload: {
    currentTime: number;
    duration: number;
    progress: number;
  }) => void;
  onEnded: () => void;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function VideoMessage({
  isMe,
  status,
  videoUrl,
  duration,
  isActive,
  isGlobalPlaying,
  playbackSpeed,
  onRequestPlay,
  onTogglePlayPause,
  onProgress,
  onEnded,
}: VideoMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCenterControl, setShowCenterControl] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [metadataDuration, setMetadataDuration] = useState<number | null>(null);
  const isSending = status === "sending";
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const totalSeconds = Math.max(1, metadataDuration ?? duration ?? 12);
  const isPlaying = isActive && isGlobalPlaying;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      if (!videoUrl) {
        setShowCenterControl(!(isActive && isGlobalPlaying && !isSending));
      }
      return;
    }

    if (!isActive || !isGlobalPlaying || isSending) {
      video.pause();
      setShowCenterControl(true);
      return;
    }

    void video.play().then(() => {
      setShowCenterControl(false);
    }).catch(() => {
      setShowCenterControl(true);
    });
  }, [isActive, isGlobalPlaying, isSending, videoUrl]);

  // Simulation interval for mock videos (when videoUrl is empty).
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && isGlobalPlaying && !videoUrl && !isSending) {
      const step = (100 / (totalSeconds * 10)) * playbackSpeed;
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = Math.min(100, prev + step);
          const elapsed = (next / 100) * totalSeconds;
          setElapsedSeconds(elapsed);
          onProgress({
            currentTime: elapsed,
            duration: totalSeconds,
            progress: next,
          });
          if (next >= 100) onEnded();
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isActive,
    isGlobalPlaying,
    isSending,
    onEnded,
    onProgress,
    playbackSpeed,
    totalSeconds,
    videoUrl,
  ]);

  useEffect(() => {
    if (!isExpanded) return;
    const handleOutsidePointer = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setIsExpanded(false);
    };

    document.addEventListener("pointerdown", handleOutsidePointer, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (isActive) return;
    if (!videoUrl) {
      setProgress(0);
      setElapsedSeconds(0);
    }
  }, [isActive, videoUrl]);

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
    const video = videoRef.current;
    if (!video || !video.duration || !isActive) return;
    const current = video.currentTime;
    const total = video.duration;
    const nextProgress = (current / total) * 100;
    setElapsedSeconds(current);
    setMetadataDuration(total);
    setProgress(nextProgress);
    onProgress({
      currentTime: current,
      duration: total,
      progress: nextProgress,
    });
  };

  const togglePlayback = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSending) return;
    setIsExpanded(true);

    if (!isActive) {
      onRequestPlay();
      return;
    }
    onTogglePlayPause();
  };

  const handleSurfaceTap = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (isSending || !isPlaying || !isActive) return;
    onTogglePlayPause();
  };

  const handleEnded = () => {
    if (!isActive) return;
    setProgress(100);
    setElapsedSeconds(totalSeconds);
    setShowCenterControl(true);
    onProgress({
      currentTime: totalSeconds,
      duration: totalSeconds,
      progress: 100,
    });
    onEnded();
  };

  const badgeSeconds = isPlaying
    ? elapsedSeconds
    : (progress / 100) * totalSeconds || totalSeconds;

  return (
    <div
      ref={rootRef}
      data-media-control="true"
      className={cn(
        "relative isolate shrink-0 transition-[width,height,transform] duration-200 ease-out",
        isExpanded ? "h-52 w-52 sm:h-56 sm:w-56" : "h-40 w-40 sm:h-44 sm:w-44",
      )}
      onPointerDown={stopEvent}
      onClick={stopEvent}
    >
      <div
        onClick={handleSurfaceTap}
        className={cn(
          "relative h-full w-full overflow-hidden rounded-full border shadow-[0_4px_12px_rgba(0,0,0,0.14)] sm:shadow-[0_10px_28px_rgba(0,0,0,0.22)]",
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
            onEnded={handleEnded}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-black/35" />

        <button
          type="button"
          onPointerDown={handleControlPointerDown}
          onClick={togglePlayback}
          className={cn(
            "absolute left-1/2 top-1/2 z-10 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "text-white backdrop-blur-none sm:backdrop-blur-md border border-white/18",
            "flex items-center justify-center transition-all duration-150",
            "hover:scale-105 active:scale-95",
            showCenterControl || !isPlaying
              ? "bg-black/62 opacity-100 scale-100"
              : "bg-black/0 opacity-0 scale-90 pointer-events-none",
          )}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/58 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/95 backdrop-blur-none sm:backdrop-blur-sm">
          {formatDuration(badgeSeconds)}
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
