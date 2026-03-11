import { useEffect, useState, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { InChatSearch } from './InChatSearch';
import { chatService } from '@/services/chat.service';
import type { Message, Chat } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  // Interaction states
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<Message | null>(null);

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

  const handleSend = async (text?: string, type: 'text' | 'voice' | 'video' | 'file' = 'text', duration?: number) => {
    if (!user) return;
    
    // We only need text for actual text messages
    if (type === 'text' && (!text || !text.trim())) return;
    
    const newMsgObj: Omit<Message, 'id' | 'createdAt' | 'status'> = {
      chatId,
      senderId: user.id,
      text: type === 'text' ? text!.trim() : undefined,
      type,
      duration,
    };
    
    // Optimistic UI update could go here, but we'll await mock delay for simplicity
    try {
      const sentMsg = await chatService.sendMessage(newMsgObj);
      setMessages(prev => [...prev, sentMsg]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!user) return;
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = { ...(m.reactions || {}) };
      if (!reactions[emoji]) reactions[emoji] = [];
      
      const userIndex = reactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
      } else {
        reactions[emoji] = [...reactions[emoji], user.id];
      }
      return { ...m, reactions };
    }));
  };

  const handleDeleteForMe = () => {
    if (messageToDelete) {
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      if (pinnedMessage?.id === messageToDelete.id) setPinnedMessage(null);
      setMessageToDelete(null);
    }
  };

  const handleDeleteForEveryone = () => {
    // In a real app we'd call the backend to remove it globally
    handleDeleteForMe();
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
      
      {/* Pinned Message Bar */}
      {pinnedMessage && (
        <div className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border shadow-sm animate-in slide-in-from-top-2 z-10 absolute top-[60px] w-full left-0">
          <div className="w-1 h-8 bg-primary rounded-full shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={() => {
               const el = document.getElementById(`msg-${pinnedMessage.id}`);
               if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }}>
            <span className="text-xs font-semibold text-primary">Pinned Message</span>
            <span className="text-[13px] text-muted-foreground truncate">
              {pinnedMessage.text || `[${pinnedMessage.type} Message]`}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setPinnedMessage(null)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </Button>
        </div>
      )}
      
      <div className={cn("flex-1 overflow-y-auto px-4 py-4 min-h-0 custom-scrollbar", pinnedMessage ? "pt-16" : "")}>
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
                 onReply={() => setReplyingToMessage(msg)}
                 repliedMessage={msg.replyToId ? messages.find(m => m.id === msg.replyToId) : undefined}
                 onDeleteToggle={() => setMessageToDelete(msg)}
                 onForwardToggle={() => setMessageToForward(msg)}
                 onPinMessage={() => setPinnedMessage(msg)}
                 onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
               />
             </div>
           ))}
           <div ref={scrollRef} />
        </div>
      </div>
      
      <MessageInput 
        onSend={handleSend} 
        replyingToMessage={replyingToMessage}
        onCancelReply={() => setReplyingToMessage(null)}
      />

      {/* Action Modals */}
      <Dialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setMessageToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteForMe}>Delete for me</Button>
            {messageToDelete?.senderId === user?.id && (
              <Button variant="destructive" onClick={handleDeleteForEveryone}>Delete for everyone</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!messageToForward} onOpenChange={(open) => !open && setMessageToForward(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              Select a conversation to forward this message to.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
             <p className="text-sm text-muted-foreground text-center italic">Forwarding chat list placeholder...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageToForward(null)}>Cancel</Button>
            <Button variant="default" onClick={() => setMessageToForward(null)}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
