export type MessageSoundId =
  | "bmw_chime"
  | "rebound"
  | "telegram"
  | "whatssapp_web"
  | "none";

export interface MessageSoundOption {
  id: MessageSoundId;
  label: string;
}

export const MESSAGE_SOUND_OPTIONS: MessageSoundOption[] = [
  { id: "bmw_chime", label: "BMW Chime" },
  { id: "rebound", label: "Rebound" },
  { id: "telegram", label: "Telegram" },
  { id: "whatssapp_web", label: "WhatsApp Web" },
  { id: "none", label: "None (Mute)" },
];

const SOUND_SOURCES: Record<Exclude<MessageSoundId, "none">, string> = {
  bmw_chime: "/sounds/bmw_chime.mp3",
  rebound: "/sounds/rebound.mp3",
  telegram: "/sounds/telegram.mp3",
  whatssapp_web: "/sounds/whatssapp_web.mp3",
};

const audioBySoundId: Partial<
  Record<Exclude<MessageSoundId, "none">, HTMLAudioElement>
> = {};
let activeAudio: HTMLAudioElement | null = null;

function toMessageSoundId(soundId: string): MessageSoundId {
  switch (soundId) {
    case "bmw_chime":
    case "rebound":
    case "telegram":
    case "whatssapp_web":
    case "none":
      return soundId;
    // legacy ids mapping
    case "iphone":
      return "whatssapp_web";
    case "soft":
      return "bmw_chime";
    case "digital":
      return "rebound";
    default:
      return "telegram";
  }
}

function ensureAudio(soundId: Exclude<MessageSoundId, "none">) {
  if (typeof window === "undefined") return null;
  if (audioBySoundId[soundId]) return audioBySoundId[soundId]!;

  const audio = new Audio(SOUND_SOURCES[soundId]);
  audio.preload = "auto";
  audioBySoundId[soundId] = audio;
  return audio;
}

export function preloadMessageSounds() {
  if (typeof window === "undefined") return;
  (
    Object.keys(SOUND_SOURCES) as Exclude<MessageSoundId, "none">[]
  ).forEach((soundId) => {
    const audio = ensureAudio(soundId);
    audio?.load();
  });
}

function stopCurrentSound() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.currentTime = 0;
  } catch {
    // non-critical
  }
  activeAudio = null;
}

export function playMessageSound(soundId: MessageSoundId | string) {
  const resolved = toMessageSoundId(soundId);
  if (resolved === "none") {
    stopCurrentSound();
    return;
  }

  const audio = ensureAudio(resolved);
  if (!audio) return;

  stopCurrentSound();

  activeAudio = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Autoplay restrictions may block playback.
  });
}
