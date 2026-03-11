import { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InChatSearchProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  matchCount: number;
  currentMatchIndex: number;
  isOpen: boolean;
}

export function InChatSearch({ 
  onSearch, 
  onClose, 
  onNextMatch, 
  onPrevMatch, 
  matchCount, 
  currentMatchIndex, 
  isOpen 
}: InChatSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      onSearch('');
    }
  }, [isOpen, onSearch]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onNextMatch();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 left-0 right-0 z-20 bg-background border-b border-border shadow-sm px-2 py-2 flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
      <div className="flex-1 relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input 
          ref={inputRef}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Search in chat..."
          className="pl-9 pr-24 h-9 bg-accent/50 border-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:bg-background focus-visible:border-ring rounded-full"
        />
        {matchCount > 0 && query && (
          <div className="absolute right-3 text-xs text-muted-foreground tabular-nums">
            {currentMatchIndex + 1} / {matchCount}
          </div>
        )}
        {matchCount === 0 && query && (
          <div className="absolute right-3 text-xs text-muted-foreground">
            No results
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <div className="flex -space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-50"
            onClick={onPrevMatch}
            disabled={matchCount === 0}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 text-muted-foreground hover:text-foreground disabled:opacity-50"
            onClick={onNextMatch}
            disabled={matchCount === 0}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>
        <div className="w-px h-5 bg-border mx-1" />
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
