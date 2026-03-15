import { Mic, Pause, Play, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PlaybackSpeed = 1 | 1.5 | 2;

interface GlobalMediaPlayerBarProps {
  isVisible: boolean;
  isPlaying: boolean;
  progress: number;
  elapsedSeconds: number;
  totalSeconds: number;
  speed: PlaybackSpeed;
  mediaType: "voice" | "video";
  senderLabel: string;
  onTogglePlayPause: () => void;
  onCycleSpeed: () => void;
  onClose: () => void;
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalMediaPlayerBar({
  isVisible,
  isPlaying,
  progress,
  elapsedSeconds,
  totalSeconds,
  speed,
  mediaType,
  senderLabel,
  onTogglePlayPause,
  onCycleSpeed,
  onClose,
}: GlobalMediaPlayerBarProps) {
  return (
    <div
      className={cn(
        "px-3 transition-all duration-250 ease-out",
        isVisible
          ? "max-h-24 translate-y-0 opacity-100 py-2"
          : "pointer-events-none max-h-0 -translate-y-2 opacity-0 py-0",
      )}
      aria-hidden={!isVisible}
    >
      <div className="chat-surface-2 rounded-2xl border border-border/60 shadow-[0_3px_14px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-2 px-2.5 pt-2.5 pb-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full bg-primary/14 text-primary hover:bg-primary/22"
            onClick={onTogglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              {mediaType === "voice" ? (
                <Mic className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Video className="h-3.5 w-3.5 text-primary" />
              )}
              <span className="truncate">
                {mediaType === "voice" ? "Voice message" : "Video message"}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="truncate text-muted-foreground">{senderLabel}</span>
            </div>
            <div className="mt-1 text-[11px] tabular-nums text-muted-foreground">
              {formatDuration(elapsedSeconds)} / {formatDuration(totalSeconds)}
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-2.5 text-[12px] font-semibold text-primary hover:bg-primary/12"
            onClick={onCycleSpeed}
          >
            {speed}x
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-2.5 pb-2.5">
          <div className="h-1.5 w-full rounded-full bg-muted/70 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-150 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
