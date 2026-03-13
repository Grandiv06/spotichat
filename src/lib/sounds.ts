let audioContext: AudioContext | null = null;
let telegramAudio: HTMLAudioElement | null = null;
let callAudio: HTMLAudioElement | null = null;
let messageNotificationAudio: HTMLAudioElement | null = null;

export type SendSoundId =
  | "ding"
  | "bubble"
  | "ping"
  | "click"
  | "chord"
  | "retro"
  | "telegram"
  | "soft"
  | "spark"
  | "drop"
  | "pop"
  | "bell"
  | "pluck"
  | "glass"
  | "rise"
  | "fall"
  | "pulse"
  | "none";

let currentSendSound: SendSoundId = "ding";

function ensureAudioContext() {
  if (typeof window === "undefined") return null;

  if (!audioContext) {
    const AC =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    audioContext = new AC();
  }

  return audioContext;
}

// ---- Presets ----

function playDing(ctx: AudioContext, now: number) {
  // Classic notification ding: کوتاه، شفاف، با هارمونیک دوم
  const baseFreq = 880; // A5

  [1, 2].forEach((mult, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const start = now + index * 0.004;
    const end = start + 0.28;

    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * mult, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(
      mult === 1 ? 0.22 : 0.12,
      start + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(0.0008, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.02);
  });
}

function playBubble(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.16);

  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

function playPing(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(820, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.11);

  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.2);
}

function playClick(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(900, now);

  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
}

function playChord(ctx: AudioContext, now: number) {
  // Soft two‑note major chord feel: quick layered tones
  const freqs = [660, 830]; // approx E5 + G#5

  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.02);

    const start = now + i * 0.02;
    const end = start + 0.25;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.13, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.02);
  });
}

function playRetro(ctx: AudioContext, now: number) {
  // Short 8‑bit style blip with descending sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

function playSoft(ctx: AudioContext, now: number) {
  // Low, warm blip – distinct از بقیه که اغلب تیزترن
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

function playSpark(ctx: AudioContext, now: number) {
  // سه نت خیلی سریع صعودی – حس جرقه
  const freqs = [900, 1200, 1500];

  freqs.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const start = now + index * 0.03;
    const end = start + 0.14;

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.02);
  });
}

function playDrop(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(350, now + 0.25);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.32);
}

function playPop(ctx: AudioContext, now: number) {
  // Pop شبیه حباب: کوتاه، با جهش بالا و بعد افت
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(500, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.16);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

function playBell(ctx: AudioContext, now: number) {
  // Simple bell-like tone using two oscillators
  const baseFreq = 880;
  [1, 2.5].forEach((mult, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq * mult, now);

    const start = now + i * 0.01;
    const end = start + 0.35;

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.16 / (i + 1), start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(end + 0.02);
  });
}

function playPluck(ctx: AudioContext, now: number) {
  // Pluck تیز شبیه ساز زهی
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(980, now);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.18);
}

function playGlass(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(2000, now + 0.18);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.24);
}

function playRise(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(900, now + 0.25);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.3);
}

function playFall(ctx: AudioContext, now: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(450, now + 0.22);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.28);
}

function playPulse(ctx: AudioContext, now: number) {
  // دو پالس پشت‌سرهم
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(650, now);

  // اولین پالس
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.13, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.002, now + 0.09);

  // دومی
  gain.gain.linearRampToValueAtTime(0.16, now + 0.11);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.22);
}

const SOUND_PLAYERS: Record<
  Exclude<SendSoundId, "none" | "telegram">,
  (ctx: AudioContext, now: number) => void
> = {
  ding: playDing,
  bubble: playBubble,
  ping: playPing,
  click: playClick,
  chord: playChord,
  retro: playRetro,
  soft: playSoft,
  spark: playSpark,
  drop: playDrop,
  pop: playPop,
  bell: playBell,
  pluck: playPluck,
  glass: playGlass,
  rise: playRise,
  fall: playFall,
  pulse: playPulse,
};

function playTelegramSample() {
  if (typeof window === "undefined") return;

  try {
    if (!telegramAudio) {
      telegramAudio = new Audio("/sounds/telegram-send.mp3");
      telegramAudio.preload = "auto";
    }

    // Restart from beginning for rapid sends
    telegramAudio.currentTime = 0;
    telegramAudio.play().catch(() => {
      // Ignore play errors (e.g. autoplay restrictions)
    });
  } catch {
    // non‑critical
  }
}

// ---- Public API ----

export function getSendSound(): SendSoundId {
  if (typeof window !== "undefined") {
    const saved = window.localStorage?.getItem("spotichat:sendSound");
    if (
      saved === "bubble" ||
      saved === "ping" ||
      saved === "click" ||
      saved === "chord" ||
      saved === "retro" ||
      saved === "soft" ||
      saved === "spark" ||
      saved === "drop" ||
      saved === "pop" ||
      saved === "bell" ||
      saved === "pluck" ||
      saved === "glass" ||
      saved === "rise" ||
      saved === "fall" ||
      saved === "pulse" ||
      saved === "telegram" ||
      saved === "none"
    ) {
      currentSendSound = saved;
    }
  }
  return currentSendSound;
}

export function setSendSound(id: SendSoundId) {
  currentSendSound = id;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem("spotichat:sendSound", id);
    } catch {
      // ignore
    }
  }
}

export function playSendSound() {
  try {
    unlockMessageNotificationAudio();
    const id = getSendSound();
    if (id === "none") return;

    if (id === "telegram") {
      playTelegramSample();
      return;
    }

    const ctx = ensureAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const player =
      SOUND_PLAYERS[id as Exclude<SendSoundId, "none" | "telegram">];
    if (!player) return;

    player(ctx, now);
  } catch {
    // Fail silently; sound is non-critical.
  }
}

// ---- Call notification sound (external file) ----

export function playCallNotificationSound(loop: boolean = false) {
  if (typeof window === "undefined") return;

  try {
    if (!callAudio) {
      callAudio = new Audio("/sounds/mixkit-happy-bells-notification-937.wav");
      callAudio.preload = "auto";
    }
    callAudio.loop = loop;
    callAudio.currentTime = 0;
    callAudio.play().catch(() => {
      // ignore autoplay errors
    });
  } catch {
    // non-critical
  }
}

/** Call this during a user gesture (e.g. when sending a message or first click) to unlock notification sound for later. */
export function unlockMessageNotificationAudio() {
  if (typeof window === "undefined") return;
  if (messageNotificationAudio) return;
  try {
    messageNotificationAudio = new Audio("/sounds/mixkit-happy-bells-notification-937.wav");
    messageNotificationAudio.preload = "auto";
    messageNotificationAudio.volume = 0;
    messageNotificationAudio.play().then(() => {
      messageNotificationAudio?.pause();
      if (messageNotificationAudio) messageNotificationAudio.currentTime = 0;
      if (messageNotificationAudio) messageNotificationAudio.volume = 0.7;
    }).catch(() => {});
  } catch {
    // ignore
  }
}

/** Play a short sound when a new message arrives (from another user). Uses an Audio file; unlock first via playSendSound or any user click. */
export function playMessageNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    if (!messageNotificationAudio) {
      messageNotificationAudio = new Audio("/sounds/mixkit-happy-bells-notification-937.wav");
      messageNotificationAudio.preload = "auto";
    }
    messageNotificationAudio.volume = 0.7;
    messageNotificationAudio.currentTime = 0;
    messageNotificationAudio.play().catch(() => {
      // Autoplay may be blocked until user has interacted with the page
    });
  } catch {
    // Fail silently
  }
}

export function stopCallNotificationSound() {
  try {
    if (callAudio) {
      callAudio.pause();
      callAudio.currentTime = 0;
      callAudio.loop = false;
    }
  } catch {
    // non-critical
  }
}

