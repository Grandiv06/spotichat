import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlaybackSpeed = 1 | 1.5 | 2;

interface AudioMessageProps {
  isMe: boolean;
  status?: "sending" | "sent" | "delivered" | "seen";
  duration?: number;
  audioUrl?: string;
  messageId: string;
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

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
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
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function AudioMessage({
  isMe,
  status,
  duration,
  audioUrl,
  messageId,
  isActive,
  isGlobalPlaying,
  playbackSpeed,
  onRequestPlay,
  onTogglePlayPause,
  onProgress,
  onEnded,
}: AudioMessageProps) {
  const [localProgress, setLocalProgress] = useState(0);
  const [metadataDuration, setMetadataDuration] = useState<number | null>(null);
  const isSending = status === "sending";
  const audioRef = useRef<HTMLAudioElement>(null);
  const totalSeconds = Math.max(1, metadataDuration ?? duration ?? 12);
  const playedSeconds = (localProgress / 100) * totalSeconds;

  const waveformHeights = useMemo(
    () => buildWaveform(hashSeed(messageId)),
    [messageId],
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isActive || !isGlobalPlaying || isSending) {
      audio.pause();
      return;
    }

    void audio.play().catch(() => {
      // Browser autoplay policies may block programmatic play in edge cases.
    });
  }, [isActive, isGlobalPlaying, isSending]);

  // Simulation logic for mocked voice messages without a real URL.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && isGlobalPlaying && !audioUrl && !isSending) {
      const step = (100 / (totalSeconds * 10)) * playbackSpeed;
      interval = setInterval(() => {
        setLocalProgress((prev) => {
          const next = Math.min(100, prev + step);
          const elapsed = (next / 100) * totalSeconds;
          onProgress({
            currentTime: elapsed,
            duration: totalSeconds,
            progress: next,
          });
          if (next >= 100) {
            onEnded();
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    audioUrl,
    isActive,
    isGlobalPlaying,
    isSending,
    onEnded,
    onProgress,
    playbackSpeed,
    totalSeconds,
  ]);

  useEffect(() => {
    if (isActive) return;
    if (!audioUrl) setLocalProgress(0);
  }, [audioUrl, isActive]);

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
    if (!audio || !audio.duration || !isActive) return;
    const current = audio.currentTime;
    const total = audio.duration;
    const progress = (current / total) * 100;
    setMetadataDuration(total);
    setLocalProgress(progress);
    onProgress({
      currentTime: current,
      duration: total,
      progress,
    });
  };

  const handleEnded = () => {
    if (!isActive) return;
    setLocalProgress(100);
    onProgress({
      currentTime: totalSeconds,
      duration: totalSeconds,
      progress: 100,
    });
    onEnded();
  };

  const togglePlayback = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isSending) return;

    if (!isActive) {
      onRequestPlay();
      return;
    }
    onTogglePlayPause();
  };

  const showPlayingState = isActive && isGlobalPlaying;

  return (
    <div
      className={cn(
        "flex items-center gap-3 w-[12.75rem] max-w-[66vw] sm:w-56 ",
        isMe ? "text-foreground" : "text-card-foreground",
      )}
    >
      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={syncAudioProgress}
          onTimeUpdate={syncAudioProgress}
          onEnded={handleEnded}
        />
      ) : null}

      <Button
        data-media-control="true"
        variant="ghost"
        size="icon"
        disabled={isSending}
        className={cn(
          "h-9 w-9 shrink-0 rounded-full border shadow-sm",
          isMe
            ? "bg-background/95 text-primary border-primary/30 hover:bg-background disabled:opacity-70"
            : "bg-primary/15 text-primary border-primary/25 hover:bg-primary/22 disabled:opacity-70",
        )}
        onPointerDown={handleControlPointerDown}
        onClick={togglePlayback}
      >
        {isSending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : showPlayingState ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-1" />
        )}
      </Button>

      <div className="flex flex-col flex-1 gap-1 min-w-0 overflow-hidden">
        <div
          className={cn(
            "flex items-end h-5 w-full gap-[2px] transition-opacity",
            isSending ? "opacity-40" : "opacity-95",
          )}
        >
          {waveformHeights.map((height, i) => {
            const barProgress = isActive ? localProgress : 0;
            const isPlayed = (i / waveformHeights.length) * 100 <= barProgress;
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-100",
                  isPlayed
                    ? "bg-foreground/80 dark:bg-foreground/85"
                    : "bg-foreground/28 dark:bg-foreground/30",
                )}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-start items-center mt-0.5">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {formatDuration(playedSeconds)} / {formatDuration(totalSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
}
