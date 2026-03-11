import { useState } from 'react';
import { Mic, Paperclip, Send, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorderUI } from './VoiceRecorderUI';

interface MessageInputProps {
  onSend: (text?: string, type?: 'text' | 'voice' | 'video' | 'file') => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaType, setMediaType] = useState<'voice' | 'video'>('voice');

  const handleSendText = () => {
    if (text.trim()) {
      onSend(text.trim(), 'text');
      setText('');
    }
  };

  const handleSendMedia = () => {
    // In a real app we would pass the actual media blob here
    onSend(undefined, mediaType);
    setIsRecording(false);
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

  const startRecording = () => {
    setIsRecording(true);
  };

  if (isRecording) {
    return (
      <div className="p-3 bg-background border-t border-border flex items-end gap-2 transition-all">
        <VoiceRecorderUI 
          onCancel={() => setIsRecording(false)} 
          onSend={handleSendMedia} 
        />
      </div>
    );
  }

  return (
    <div className="p-3 bg-background border-t border-border flex items-end gap-2 transition-all">
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
      
      {text.trim() ? (
        <Button 
          onClick={handleSendText} 
          size="icon" 
          className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110 animate-in zoom-in duration-200"
        >
          <Send className="h-5 w-5 ml-1" />
        </Button>
      ) : (
        <div className="flex gap-1 animate-in zoom-in duration-200">
           {/* Long press/hold starts recording, click toggles mode (simulated roughly here) */}
           {mediaType === 'voice' ? (
              <Button 
                variant="ghost"
                size="icon" 
                className="h-11 w-11 flex-shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground relative group"
                onClick={toggleMediaType}
                onContextMenu={(e) => { e.preventDefault(); startRecording(); }}
                onDoubleClick={startRecording}
                title="Click to switch to Video, Right-click/Double-Click to Record"
              >
                <Mic className="h-5 w-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border text-xs px-2 py-1 rounded shadow-sm pointer-events-none whitespace-nowrap transition-opacity">
                  Click to switch
                </span>
              </Button>
           ) : (
              <Button 
                variant="ghost"
                size="icon" 
                className="h-11 w-11 flex-shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground relative group"
                onClick={toggleMediaType}
                onContextMenu={(e) => { e.preventDefault(); startRecording(); }}
                onDoubleClick={startRecording}
                title="Click to switch to Audio, Right-click/Double-Click to Record"
              >
                <Video className="h-5 w-5" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-background border text-xs px-2 py-1 rounded shadow-sm pointer-events-none whitespace-nowrap transition-opacity">
                  Click to switch
                </span>
              </Button>
           )}
        </div>
      )}
    </div>
  );
}
