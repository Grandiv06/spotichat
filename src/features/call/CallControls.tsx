import { MicOff, Mic, Volume2, VolumeX, Video, PhoneOff } from "lucide-react";
import { CallButton } from "./CallButton";

interface CallControlsProps {
  isMuted: boolean;
  speakerOn: boolean;
  videoOn: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
}

export function CallControls({
  isMuted,
  speakerOn,
  videoOn,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
  onEndCall,
}: CallControlsProps) {
  return (
    <div className="w-full max-w-md mx-auto flex items-center justify-between gap-6 px-10 pb-10">
      <CallButton
        icon={
          isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />
        }
        label={isMuted ? "Unmute" : "Mute"}
        active={isMuted}
        variant="subtle"
        onClick={onToggleMute}
      />
      <CallButton
        icon={
          speakerOn ? (
            <Volume2 className="h-6 w-6" />
          ) : (
            <VolumeX className="h-6 w-6" />
          )
        }
        label={speakerOn ? "Speaker" : "Earpiece"}
        active={speakerOn}
        variant="subtle"
        onClick={onToggleSpeaker}
      />
      <CallButton
        icon={<Video className="h-6 w-6" />}
        label={videoOn ? "Video on" : "Video"}
        active={videoOn}
        variant="subtle"
        onClick={onToggleVideo}
      />
      <CallButton
        icon={<PhoneOff className="h-6 w-6" />}
        label="End"
        variant="danger"
        onClick={onEndCall}
      />
    </div>
  );
}
