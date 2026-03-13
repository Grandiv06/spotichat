import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { chatService } from "@/services/chat.service";
import type { Chat, Message } from "@/services/chat.service";
import { useChatStore } from "@/store/chat.store";
import { useChatsStore } from "@/store/chats.store";
import { usePrivacySettingsStore } from "@/features/settings/store/privacy.store";
import { useOnlineStore } from "@/store/online.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

function lastMessagePreview(msg: Message | undefined): string {
  if (!msg) return "No messages yet";
  if (msg.type === "text" && msg.text) return msg.text;
  if (msg.type === "voice") return "Voice message";
  if (msg.type === "video") return "Video message";
  return "Message";
}

export function ChatList() {
  const { chats, setChats, addUnread, clearUnread, getUnreadCount, updateLastMessage } =
    useChatsStore();
  const { selectedChatId, setSelectedChatId } = useChatStore();
  const { isOnline } = useOnlineStore();
  const { user } = useAuthStore();

  useEffect(() => {
    chatService.getChats().then((chats) => {
      setChats(chats);
      const addBlockedByUser = usePrivacySettingsStore.getState().addBlockedByUser;
      chats.forEach((c) => {
        if (c.blockedByThem && c.participant?.id) addBlockedByUser(c.participant.id);
      });
    });
  }, []);

  useEffect(() => {
    if (selectedChatId) clearUnread(selectedChatId);
  }, [selectedChatId]);

  useEffect(() => {
    const unsub = chatService.onNewMessage((message: Message) => {
      updateLastMessage(message.chatId, message);
      const isFromOther = message.senderId !== user?.id;
      if (isFromOther) {
        if (message.chatId !== selectedChatId) addUnread(message.chatId);
        chatService.markDelivered(message.id);
      }
    });
    return unsub;
  }, [selectedChatId, user?.id, updateLastMessage, addUnread]);

  const handleSelectChat = (chat: Chat) => {
    setSelectedChatId(chat.id);
    clearUnread(chat.id);
  };

  return (
    <div className="px-2 space-y-0.5">
      {chats.map((chat) => {
        const unread = getUnreadCount(chat.id);
        const blockedByThem = !!chat.blockedByThem;
        const online = !blockedByThem && chat.participant?.id ? isOnline(chat.participant.id) : false;
        return (
          <div
            key={chat.id}
            onClick={() => handleSelectChat(chat)}
            className={cn(
              "p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors",
              selectedChatId === chat.id
                ? "bg-primary text-primary-foreground select-none"
                : "hover:bg-accent/50",
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-12 w-12 border border-border/50">
                <AvatarImage src={blockedByThem ? undefined : chat.participant?.avatar} />
                <AvatarFallback
                  className={selectedChatId === chat.id ? "text-foreground" : ""}
                >
                  {chat.participant?.name?.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              {online && (
                <span
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500"
                  title="Online"
                />
              )}
            </div>

            <div className="flex-1 overflow-hidden min-w-0">
              <div className="flex justify-between items-center mb-1 gap-2">
                <h3 className="font-semibold text-[15px] truncate">
                  {chat.participant?.name ?? "Unknown"}
                </h3>
                {chat.lastMessage && (
                  <span
                    className={cn(
                      "text-xs whitespace-nowrap shrink-0",
                      selectedChatId === chat.id
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center gap-2">
                <p
                  className={cn(
                    "text-sm truncate",
                    selectedChatId === chat.id
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground",
                  )}
                >
                  {lastMessagePreview(chat.lastMessage)}
                </p>
                {unread > 0 && selectedChatId !== chat.id && (
                  <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium shrink-0">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {chats.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No chats yet
        </div>
      )}
    </div>
  );
}
