import { useEffect, useState, useRef } from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { chatService } from '@/services/chat.service';
import type { Message, Chat } from '@/services/chat.service';
import { useAuthStore } from '@/store/auth.store';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatAreaProps {
  chatId: string;
}

export function ChatArea({ chatId }: ChatAreaProps) {
  const { user } = useAuthStore();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (text: string) => {
    if (!user) return;
    
    const newMsgObj = {
      chatId,
      senderId: user.id,
      text,
      type: 'text' as const,
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
    <div className="flex-1 flex flex-col h-full bg-accent/5 relative">
      <ChatHeader participant={chat.participant} />
      
      <ScrollArea className="flex-1 px-4 py-4">
        <div className="flex flex-col gap-2 min-h-full justify-end pb-2">
           {/* Simple date badge placeholder */}
           <div className="flex justify-center my-4">
             <span className="bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                Today
             </span>
           </div>
           
           {messages.map((msg) => (
             <MessageBubble key={msg.id} message={msg} />
           ))}
           <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <MessageInput onSend={handleSend} />
    </div>
  );
}
