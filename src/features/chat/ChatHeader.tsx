import { useState } from "react";
import { MoreVertical, Phone, Search, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat.store";
import type { User } from "@/services/auth.service";
import { ChatProfileSheet } from "./ChatProfileSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatHeaderProps {
  participant: User;
  onToggleSearch?: () => void;
  onStartCall?: () => void;
  onBlockUser?: () => void;
}

export function ChatHeader({
  participant,
  onToggleSearch,
  onStartCall,
  onBlockUser,
}: ChatHeaderProps) {
  const { setSelectedChatId } = useChatStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const isRestrictivePrivacyUser = participant.id === "u3";

  return (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-2 sm:px-4 bg-background z-10 chat-header">
        <div
          className="flex items-center gap-1 sm:gap-3 cursor-pointer"
          onClick={() => setProfileOpen(true)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-1"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChatId(null);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={isRestrictivePrivacyUser ? undefined : participant.avatar} />
            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col pl-2">
            <span className="font-semibold">{participant.name}</span>
            <span className="text-xs text-muted-foreground">
              {isRestrictivePrivacyUser
                ? "last seen a long time ago"
                : "last seen recently"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onToggleSearch}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={onStartCall}
          >
            <Phone className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Mute Notifications</DropdownMenuItem>
              <DropdownMenuItem>Clear Chat</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onBlockUser}
              >
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ChatProfileSheet
        user={participant}
        isOpen={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </>
  );
}
