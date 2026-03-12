import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/services/auth.service";
import { CallControls } from "./CallControls";
import { playCallNotificationSound, stopCallNotificationSound } from "@/lib/sounds";

interface CallScreenProps {
  participant: User;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_SEQUENCE = [
  "Calling…",
  "Ringing…",
  "Connecting…",
  "Call in progress",
] as const;

type CallStatus = (typeof STATUS_SEQUENCE)[number];

export function CallScreen({ participant, isOpen, onClose }: CallScreenProps) {
  const [status, setStatus] = useState<CallStatus>("Calling…");
  const [isMuted, setIsMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setStatus("Calling…");
    setIsMuted(false);
    setSpeakerOn(false);
    setVideoOn(false);

    // Start looping ring sound while we are dialing
    playCallNotificationSound(true);

    const timers = [
      setTimeout(() => setStatus("Ringing…"), 1200),
      setTimeout(() => setStatus("Connecting…"), 2600),
      setTimeout(() => setStatus("Call in progress"), 4300),
    ];

    return () => {
      timers.forEach((t) => clearTimeout(t));
      stopCallNotificationSound();
    };
  }, [isOpen]);

  // Stop ringing once call is "connected"
  useEffect(() => {
    if (status === "Call in progress") {
      stopCallNotificationSound();
    }
  }, [status]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl border border-white/5 flex flex-col items-center justify-between py-8">
        {/* Top label */}
        <div className="pt-2 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">
          SpotiChat Call
        </p>
      </div>

        {/* Center content */}
        <div className="flex flex-col items-center gap-5 px-8 mt-4 mb-6">
        <Avatar className="h-28 w-28 md:h-32 md:w-32 ring-4 ring-white/10 shadow-2xl">
          <AvatarImage src={participant.avatar} />
          <AvatarFallback className="text-3xl bg-white/10">
            {participant.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {participant.name}
          </h2>
          <p className="text-sm text-white/70">{status}</p>
        </div>
      </div>

        {/* Bottom controls */}
        <div className="w-full mt-2">
        <CallControls
          isMuted={isMuted}
          speakerOn={speakerOn}
          videoOn={videoOn}
          onToggleMute={() => setIsMuted((v) => !v)}
          onToggleSpeaker={() => setSpeakerOn((v) => !v)}
          onToggleVideo={() => setVideoOn((v) => !v)}
          onEndCall={onClose}
        />
      </div>
      </div>
    </div>
  );
}

