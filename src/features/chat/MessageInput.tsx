import { useState, useRef } from 'react';
import { Mic, Paperclip, Send, Video, Lock, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorderUI } from './VoiceRecorderUI';
import { VideoRecorderUI } from './VideoRecorderUI';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSend: (text?: string, type?: 'text' | 'voice' | 'video' | 'file') => void;
}

type RecordingState = 'idle' | 'holding' | 'locked';

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [mediaType, setMediaType] = useState<'voice' | 'video'>('voice');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  
  const { requestAudio, requestVideo, stopAudio, stopVideo, audio, video } = useMediaPermissions();
  
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startY = useRef<number>(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text.trim(), 'text');
      setText('');
    }
  };

  const handleSendMedia = () => {
    onSend(undefined, mediaType);
    setRecordingState('idle');
    stopAudio();
    stopVideo();
  };

  const cancelRecording = () => {
    setRecordingState('idle');
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

  // --- Pointer Interaction Logic ---
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only process left click / touch
    if (recordingState !== 'idle') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;

    pressTimer.current = setTimeout(async () => {
      // Long press detected
      let stream;
      if (mediaType === 'voice') {
        stream = await requestAudio();
      } else {
        stream = await requestVideo();
      }
      
      if (stream) {
        setRecordingState('holding');
      } else {
        // Permission denied or error
      }
    }, 300); // 300ms to differentiate click from hold
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (recordingState === 'holding') {
      const deltaY = startY.current - e.clientY;
      if (deltaY > 50) { // Dragged up by 50px
        setRecordingState('locked');
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    
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

  const onPointerCancel = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (recordingState === 'holding') {
      cancelRecording();
    }
  };

  return (
    <div className="relative p-3 bg-background border-t border-border flex items-end gap-2 transition-all">
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
              placeholder="Write a message..."
              className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-[15px] placeholder:text-muted-foreground/70"
              rows={1}
              style={{ minHeight: '24px' }}
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
        <Button onClick={handleSendText} size="icon" className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 animate-in zoom-in duration-200">
          <Send className="h-5 w-5 ml-1" />
        </Button>
      ) : recordingState === 'locked' ? (
        <Button onClick={handleSendMedia} size="icon" className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 animate-in zoom-in">
          <Send className="h-5 w-5 ml-1" />
        </Button>
      ) : (
        <div className="flex gap-1 animate-in zoom-in duration-200 relative touch-none">
          <Button 
            ref={buttonRef}
            variant="ghost"
            size="icon" 
            className={cn(
              "h-11 w-11 flex-shrink-0 rounded-full text-muted-foreground relative group touch-none select-none",
              recordingState === 'holding' ? "bg-primary text-primary-foreground scale-125 hover:bg-primary shadow-lg" : "hover:bg-accent hover:text-foreground"
            )}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={(e) => e.preventDefault()}
            title="Click to switch, Hold to Record"
          >
             {mediaType === 'voice' ? <Mic className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </div>
      )}
    </div>
  );
}
