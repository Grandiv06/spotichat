import { useState } from 'react';
import { Mic, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSend: (text: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 bg-background border-t border-border flex items-end gap-2">
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
          onClick={handleSend} 
          size="icon" 
          className="h-11 w-11 flex-shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:brightness-110"
        >
          <Send className="h-5 w-5 ml-1" />
        </Button>
      ) : (
        <Button 
          variant="ghost"
          size="icon" 
          className="h-11 w-11 flex-shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Mic className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
