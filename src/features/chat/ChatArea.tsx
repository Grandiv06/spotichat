import { useEffect, useState, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { InChatSearch } from './InChatSearch';
import { chatService } from '@/services/chat.service';
import type { Message, Chat } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { user } = useAuthStore();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Matches (reversed so index 0 is the newest match)
  const matchedMessages = messages
    .filter(m => m.text?.toLowerCase().includes(searchQuery.toLowerCase()))
    .reverse();
  const matchCount = searchQuery ? matchedMessages.length : 0;

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (matchCount > 0 && isSearching) {
      const match = matchedMessages[currentMatchIndex];
      const el = document.getElementById(`msg-${match.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, searchQuery, matchCount, isSearching]);

  const handleNextMatch = () => {
    setCurrentMatchIndex(prev => Math.min(prev + 1, matchCount - 1));
  };

  const handlePrevMatch = () => {
    setCurrentMatchIndex(prev => Math.max(prev - 1, 0));
  };

  useEffect(() => {
    const loadChat = async () => {
      setIsLoading(true);
      try {
        const chats = await chatService.getChats();
        const currentChat = chats.find(c => c.id === chatId);
        if (currentChat) setChat(currentChat);
        
        const msgs = await chatService.getMessages(chatId);
        setMessages(msgs);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChat();
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when messages load or send
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text?: string, type: 'text' | 'voice' | 'video' | 'file' = 'text') => {
    if (!user) return;
    
    // We only need text for actual text messages
    if (type === 'text' && (!text || !text.trim())) return;
    
    const newMsgObj = {
      chatId,
      senderId: user.id,
      text: type === 'text' ? text!.trim() : undefined,
      type,
    };
    
    // Optimistic UI update could go here, but we'll await mock delay for simplicity
    try {
      const sentMsg = await chatService.sendMessage(newMsgObj);
      setMessages(prev => [...prev, sentMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-accent/10">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Chat not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-accent/5 relative min-h-0">
      <ChatHeader participant={chat.participant} onToggleSearch={() => setIsSearching(true)} />
      <InChatSearch 
        isOpen={isSearching}
        onClose={() => { setIsSearching(false); setSearchQuery(''); }}
        onSearch={setSearchQuery}
        matchCount={matchCount}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={handleNextMatch}
        onPrevMatch={handlePrevMatch}
      />
      
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0 custom-scrollbar">
        <div className="flex flex-col gap-2 min-h-full justify-end pb-2">
           {/* Simple date badge placeholder */}
           <div className="flex justify-center my-4 sticky top-0 z-10">
             <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                Today
             </span>
           </div>
           
           {messages.map((msg) => (
             <div key={msg.id} id={`msg-${msg.id}`}>
               <MessageBubble 
                 message={msg} 
                 searchQuery={searchQuery}
                 isHighlightedMatch={isSearching && matchCount > 0 && matchedMessages[currentMatchIndex]?.id === msg.id}
               />
             </div>
           ))}
           <div ref={scrollRef} />
        </div>
      </div>
      
      <MessageInput onSend={handleSend} />
    </div>
  );
}
