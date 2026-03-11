import { useState, useRef } from 'react';
import { Mic, Paperclip, Send, Video, Lock, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorderUI } from './VoiceRecorderUI';
import { VideoRecorderUI } from './VideoRecorderUI';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (text?: string, type?: 'text' | 'voice' | 'video' | 'file', duration?: number) => void;
  replyingToMessage?: any; // Message type from service
  onCancelReply?: () => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'holding' | 'locked';

export function MessageInput({ onSend, replyingToMessage, onCancelReply, disabled }: MessageInputProps) {
  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<'voice' | 'video'>('voice');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  
  const { requestAudio, requestVideo, stopAudio, stopVideo, audio, video } = useMediaPermissions();
  
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startY = useRef<number>(0);
  const recordingStartTime = useRef<number>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text.trim(), 'text');
      setText('');
    }
  };

  const handleSendMedia = () => {
    const durationObj = recordingStartTime.current ? Math.floor((Date.now() - recordingStartTime.current) / 1000) : 0;
    onSend(undefined, mediaType, durationObj);
    setRecordingState('idle');
    recordingStartTime.current = 0;
    stopAudio();
    stopVideo();
  };

  const cancelRecording = () => {
    setRecordingState('idle');
    recordingStartTime.current = 0;
    stopAudio();
    stopVideo();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const toggleMediaType = () => {
    setMediaType(prev => prev === 'voice' ? 'video' : 'voice');
  };

  // --- Interaction Logic (Touch & Mouse unified) ---
  const handleStart = (clientY: number) => {
    if (recordingState !== 'idle') return;

    startY.current = clientY;

    pressTimer.current = setTimeout(async () => {
      // Long press detected
      let stream;
      if (mediaType === 'voice') {
        stream = await requestAudio();
      } else {
        stream = await requestVideo();
      }
      
      if (stream) {
        recordingStartTime.current = Date.now();
        setRecordingState('holding');
      }
    }, 300); // 300ms to differentiate click from hold
  };

  const handleMove = (clientY: number) => {
    if (recordingState === 'holding') {
      const deltaY = startY.current - clientY;
      if (deltaY > 50) { // Dragged up by 50px
        setRecordingState('locked');
      }
    }
  };

  const handleEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (recordingState === 'holding') {
      // Released without locking, send immediately
      handleSendMedia();
    } else if (recordingState === 'idle') {
      // Short click detected
      toggleMediaType();
    }
  };

  const handleCancel = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (recordingState === 'holding') {
      cancelRecording();
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Only process left click for mouse
    e.currentTarget.setPointerCapture(e.pointerId);
    handleStart(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    handleMove(e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    handleEnd();
  };

  const onPointerCancel = () => {
    handleCancel();
  };
  
  // Native touch events for better mobile reliability
  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY);
  };
  
  const onTouchEnd = () => {
    handleEnd();
  };

  return (
    <div className="flex flex-col bg-background border-t border-border transition-all w-full relative">
      {/* Reply Preview Banner */}
      {replyingToMessage && (
        <div className="flex items-center gap-3 px-4 py-2 bg-accent/20 border-b border-border/50 animate-in slide-in-from-bottom-2">
          <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-primary truncate">Replying to message</span>
            <span className="text-[13px] text-muted-foreground truncate">
              {replyingToMessage.text || `[${replyingToMessage.type} Message]`}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={onCancelReply}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </Button>
        </div>
      )}
      
      <div className="relative p-3 flex items-end gap-2 w-full">
        {/* Slide to Lock UI Overlay */}
        {recordingState === 'holding' && (
        <div className="absolute right-4 bottom-20 flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-background border rounded-full p-2 shadow-sm mb-2 opacity-80">
            <Lock className="h-5 w-5 text-muted-foreground mb-1" />
            <ArrowUp className="h-5 w-5 text-muted-foreground animate-bounce" />
          </div>
        </div>
      )}

      {/* Left Side: TextField OR Recording Interface */}
      {recordingState === 'idle' ? (
        <>
          <Button variant="ghost" size="icon" className="text-muted-foreground h-11 w-11 flex-shrink-0 rounded-full hover:bg-accent hover:text-foreground">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 bg-accent/50 rounded-2xl min-h-[44px] flex items-center px-4 py-2 border border-transparent focus-within:border-ring transition-colors">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Connecting..." : "Write a message..."}
              className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-[15px] placeholder:text-muted-foreground/70 disabled:opacity-50"
              rows={1}
              style={{ minHeight: '24px' }}
              disabled={disabled}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 bg-accent/30 rounded-2xl min-h-[44px] flex items-center px-2 py-1 border border-border/50 overflow-visible relative">
          {mediaType === 'voice' ? (
            <VoiceRecorderUI onCancel={cancelRecording} onSend={handleSendMedia} isLocked={recordingState === 'locked'} stream={audio.stream} />
          ) : (
            <VideoRecorderUI onCancel={cancelRecording} onSend={handleSendMedia} isLocked={recordingState === 'locked'} stream={video.stream} />
          )}
        </div>
      )}

      {/* Right Side: Action Button */}
      {text.trim() && recordingState === 'idle' ? (
        <Button onClick={handleSendText} disabled={disabled} size="icon" className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 animate-in zoom-in duration-200 flex items-center justify-center p-0">
          <Send className="h-5 w-5 relative" style={{ left: '-1px', top: '1px' }} />
        </Button>
      ) : recordingState === 'locked' ? (
        <Button onClick={handleSendMedia} disabled={disabled} size="icon" className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 animate-in zoom-in flex items-center justify-center p-0">
          <Send className="h-5 w-5 relative" style={{ left: '-1px', top: '1px' }} />
        </Button>
      ) : (
        <div className="flex gap-1 animate-in zoom-in duration-200 relative touch-none">
          <Button 
            ref={buttonRef}
            variant="ghost"
            size="icon" 
            disabled={disabled}
            className={cn(
              "h-11 w-11 flex-shrink-0 rounded-full text-muted-foreground relative group touch-none select-none",
              recordingState === 'holding' ? "bg-primary text-primary-foreground scale-125 hover:bg-primary shadow-lg" : "hover:bg-accent hover:text-foreground"
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={handleCancel}
            onContextMenu={(e) => e.preventDefault()}
            title="Click to switch, Hold to Record"
          >
             {mediaType === 'voice' ? <Mic className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </div>
        )}
      </div>
    </div>
  );
}
