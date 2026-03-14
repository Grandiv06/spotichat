import { useCallback, useEffect } from "react";
import {
  playMessageSound,
  preloadMessageSounds,
  type MessageSoundId,
} from "@/lib/notification-sound";
import { useSettingsStore } from "@/features/settings/store/settings.store";

function canPlayInCurrentContext() {
  if (typeof document === "undefined") return false;
  if (document.visibilityState === "visible") return true;
  if (typeof Notification === "undefined") return false;
  return Notification.permission === "granted";
}

export function useNotificationSound() {
  const messageSound = useSettingsStore((s) => s.messageSound);
  const muteAllChats = useSettingsStore((s) => s.muteAllChats);
  const isChatMuted = useSettingsStore((s) => s.isChatMuted);

  useEffect(() => {
    preloadMessageSounds();
  }, []);

  const playPreview = useCallback((soundId: MessageSoundId) => {
    playMessageSound(soundId);
  }, []);

  const playIncoming = useCallback(
    (chatId: string) => {
      if (messageSound === "none") return;
      if (muteAllChats) return;
      if (isChatMuted(chatId)) return;
      if (!canPlayInCurrentContext()) return;
      playMessageSound(messageSound);
    },
    [messageSound, muteAllChats, isChatMuted],
  );

  return {
    messageSound,
    playPreview,
    playIncoming,
  };
}
