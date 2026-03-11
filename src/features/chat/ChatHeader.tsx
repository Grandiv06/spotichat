import { MoreVertical, Phone, Search, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat.store';
import type { User } from '@/services/auth.service';

interface ChatHeaderProps {
  participant: User;
}

export function ChatHeader({ participant }: ChatHeaderProps) {
  const { setSelectedChatId } = useChatStore();

  return (
    <div className="h-16 border-b border-border flex items-center justify-between px-2 sm:px-4 bg-background z-10 sticky top-0">
      <div className="flex items-center gap-1 sm:gap-3 cursor-pointer">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-1" 
          onClick={() => setSelectedChatId(null)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarImage src={participant.avatar} />
          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold">{participant.name}</span>
          <span className="text-xs text-muted-foreground">last seen recently</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
