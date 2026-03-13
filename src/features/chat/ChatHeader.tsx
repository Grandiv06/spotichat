import { useState } from "react";
import { MoreVertical, Phone, Search, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/chat.store";
import { useOnlineStore } from "@/store/online.store";
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
  activity?: "typing" | "voice" | "video" | null;
  isBlockedByMe?: boolean;
  /** True when this participant has blocked the current user (hide profile, show "last seen a long time ago") */
  isBlockedByThem?: boolean;
  onToggleSearch?: () => void;
  onStartCall?: () => void;
  onBlockUser?: () => void;
  onUnblockUser?: () => void;
}

export function ChatHeader({
  participant,
  activity,
  isBlockedByMe,
  isBlockedByThem,
  onToggleSearch,
  onStartCall,
  onBlockUser,
  onUnblockUser,
}: ChatHeaderProps) {
  const { setSelectedChatId } = useChatStore();
  const { isOnline } = useOnlineStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const showOnline = !isBlockedByThem && isOnline(participant.id);

  const lastSeenLabel = (): string => {
    if (showOnline) return "online";
    const at = participant.lastSeenAt;
    if (!at) return "last seen recently";
    const d = new Date(at);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "last seen recently";
    if (diffMins < 60) return "last seen recently";
    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return `last seen today at ${timeStr}`;
    if (isYesterday) return `last seen yesterday at ${timeStr}`;
    const dateStr = d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `last seen ${dateStr} at ${timeStr}`;
  };

  return (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-2 sm:px-4 bg-background z-10 chat-header">
        <div
          className="flex items-center gap-2  sm:gap-2 cursor-pointer"
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
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={isBlockedByThem ? undefined : participant.avatar}
              />
              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {showOnline && (
              <span
                className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
                title="Online"
              />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">{participant.name}</span>
            <span
              className={
                showOnline || activity
                  ? "text-xs text-green-600 dark:text-green-400"
                  : "text-xs text-muted-foreground"
              }
            >
              {activity === "typing"
                ? "typing..."
                : activity === "voice"
                ? "recording a voice message"
                : activity === "video"
                ? "recording a video message"
                : isBlockedByThem
                ? "last seen a long time ago"
                : lastSeenLabel()}
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
              {isBlockedByMe ? (
                <DropdownMenuItem
                  className="text-primary focus:text-primary"
                  onClick={onUnblockUser}
                >
                  Unblock User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onBlockUser}
                >
                  Block User
                </DropdownMenuItem>
              )}
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
