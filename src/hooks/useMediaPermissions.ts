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

  const requestAudio = useCallback(async (): Promise<MediaStream | null> => {
    if (audioStreamRef.current && audioStreamRef.current.active) {
      return audioStreamRef.current;
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
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Microphone permission was denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
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

    try {
      setVideoState(prev => ({ ...prev, error: null }));
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoStreamRef.current = stream;
      setVideoState({ stream, permission: 'granted', error: null });
      return stream;
    } catch (err: any) {
      console.error('Error requesting camera:', err);
      let errorMsg = 'Camera and microphone access are required to record video messages.';
      if (err.name === 'NotAllowedError') {
        errorMsg = 'Camera permission was denied. Please allow access in your browser settings.';
      } else if (err.name === 'NotFoundError') {
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
