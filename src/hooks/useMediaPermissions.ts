import { useState, useCallback, useRef } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied';
export type MediaType = 'audio' | 'video';

interface MediaState {
  stream: MediaStream | null;
  permission: PermissionState;
  error: string | null;
}

export function useMediaPermissions() {
  const [audioState, setAudioState] = useState<MediaState>({
    stream: null,
    permission: 'prompt',
    error: null,
  });

  const [videoState, setVideoState] = useState<MediaState>({
    stream: null,
    permission: 'prompt',
    error: null,
  });

  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  const ensureMediaSupport = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'Media APIs are not available in this environment.';
    }

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!window.isSecureContext && !isLocalhost) {
      return 'Voice and video recording only work on secure (HTTPS) connections or localhost.';
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'This browser does not support microphone/camera access for recording.';
    }

    return null;
  };

  const requestAudio = useCallback(async (): Promise<MediaStream | null> => {
    if (audioStreamRef.current && audioStreamRef.current.active) {
      return audioStreamRef.current;
    }

    const supportError = ensureMediaSupport();
    if (supportError) {
      setAudioState({ stream: null, permission: 'denied', error: supportError });
      return null;
    }

    try {
      setAudioState(prev => ({ ...prev, error: null }));
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setAudioState({ stream, permission: 'granted', error: null });
      return stream;
    } catch (err: any) {
      console.error('Error requesting microphone:', err);
      let errorMsg = 'Microphone access is required to record voice messages.';
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        errorMsg =
          'Microphone permission was denied or blocked. Please allow access in your browser settings.';
      } else if (err?.name === 'NotFoundError') {
        errorMsg = 'No microphone device was found on this system.';
      }
      setAudioState(prev => ({ ...prev, permission: 'denied', error: errorMsg }));
      return null;
    }
  }, []);

  const requestVideo = useCallback(async (): Promise<MediaStream | null> => {
    if (videoStreamRef.current && videoStreamRef.current.active) {
      return videoStreamRef.current;
    }

    const supportError = ensureMediaSupport();
    if (supportError) {
      setVideoState({ stream: null, permission: 'denied', error: supportError });
      return null;
    }

    try {
      setVideoState(prev => ({ ...prev, error: null }));
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      videoStreamRef.current = stream;
      setVideoState({ stream, permission: 'granted', error: null });
      return stream;
    } catch (err: any) {
      console.error('Error requesting camera:', err);
      let errorMsg = 'Camera and microphone access are required to record video messages.';
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        errorMsg =
          'Camera permission was denied or blocked. Please allow access in your browser settings.';
      } else if (err?.name === 'NotFoundError') {
        errorMsg = 'No camera device was found on this system.';
      }
      setVideoState(prev => ({ ...prev, permission: 'denied', error: errorMsg }));
      return null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    setAudioState({ stream: null, permission: 'prompt', error: null });
  }, []);

  const stopVideo = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    setVideoState({ stream: null, permission: 'prompt', error: null });
  }, []);

  return {
    audio: audioState,
    video: videoState,
    requestAudio,
    requestVideo,
    stopAudio,
    stopVideo,
  };
}
