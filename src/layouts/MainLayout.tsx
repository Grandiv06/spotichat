import { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import {
  Plus,
  Menu,
  Search,
  ArrowLeft,
  Users,
  Hash,
  UserPlus,
} from "lucide-react";
import { useModalStore } from "@/store/modal.store";
import { useSettingsStore } from "@/features/settings/store/settings.store";
import { useChatStore } from "@/store/chat.store";
import { useChatsStore } from "@/store/chats.store";
import { useAuthStore } from "@/store/auth.store";
import { useConnectionStatusStore } from "@/store/connection-status.store";
import { connectSocket, getSocket, onSocketEvent } from "@/lib/socket";
import { unlockMessageNotificationAudio } from "@/lib/sounds";
import { chatService } from "@/services/chat.service";
import type { Message } from "@/services/chat.service";

import { apiFetch } from "@/lib/api";
import { contactService } from "@/services/contact.service";
import { settingsService } from "@/services/settings.service";
import { usePrivacySettingsStore } from "@/features/settings/store/privacy.store";
import { useOnlineStore } from "@/store/online.store";
import { useMessageStatusStore } from "@/store/message-status.store";
import { ChatList } from "@/features/chat/ChatList";
import { ModalProvider } from "@/features/modals/ModalProvider";
import { useAppViewportHeight } from "@/hooks/useAppViewportHeight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stories } from "@/features/chat/Stories";
import { useNotificationSound } from "@/hooks/useNotificationSound";

export function MainLayout() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [storiesCollapsed, setStoriesCollapsed] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { playIncoming } = useNotificationSound();
  useAppViewportHeight();

  // Connect WebSocket when user is authenticated (e.g. after refresh)
  useEffect(() => {
    if (!isAuthenticated) return;
    connectSocket();
  }, [isAuthenticated]);

  // Unlock notification sound on first user interaction (browser autoplay policy)
  useEffect(() => {
    if (!isAuthenticated) return;
    const unlock = () => unlockMessageNotificationAudio();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [isAuthenticated]);

  // Connection status: window online/offline + socket connect/disconnect (Telegram-like)
  useEffect(() => {
    if (!isAuthenticated) return;
    const setStatus = useConnectionStatusStore.getState().setStatus;
    let updatingTimeout: ReturnType<typeof setTimeout> | null = null;

    const onOnline = () => setStatus("connecting");
    const onOffline = () => {
      if (updatingTimeout) clearTimeout(updatingTimeout);
      setStatus("offline");
    };
    const onConnect = () => {
      setStatus("updating");
      if (updatingTimeout) clearTimeout(updatingTimeout);
      updatingTimeout = setTimeout(() => {
        updatingTimeout = null;
        setStatus("connected");
      }, 2000);
    };
    const onDisconnect = () => {
      if (updatingTimeout) clearTimeout(updatingTimeout);
      updatingTimeout = null;
      if (navigator.onLine) setStatus("connecting");
    };

    if (!navigator.onLine) setStatus("offline");
    else {
      const s = getSocket();
      if (s.connected) onConnect();
      else setStatus("connecting");
    }

    const s = getSocket();
    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      if (updatingTimeout) clearTimeout(updatingTimeout);
    };
  }, [isAuthenticated]);

  // Fetch online users and subscribe to online/offline events
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchOnline = async () => {
      try {
        const data = await apiFetch("/users/online");
        if (Array.isArray(data?.userIds)) {
          useOnlineStore.getState().setOnline(data.userIds);
        }
      } catch {
        // ignore
      }
    };
    fetchOnline();
    const unsubOnline = chatService.onUserOnline(({ userId }) => {
      useOnlineStore.getState().addOnline(userId);
    });
    const unsubOffline = chatService.onUserOffline(({ userId }) => {
      useOnlineStore.getState().removeOnline(userId);
    });
    const unsubStatus = chatService.onMessageStatus((data: { id: string; status: string }) => {
      useMessageStatusStore.getState().setStatus(data.id, data.status);
    });
    const unsubNewMessage = chatService.onNewMessage((message: Message) => {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser || message.senderId === currentUser.id) return;

      // Play only when user is online/connected.
      if (!navigator.onLine) return;
      const connectionStatus = useConnectionStatusStore.getState().status;
      if (connectionStatus !== "connected") return;

      // If this chat is currently open, message will be seen immediately -> no notification sound.
      const openChatId = useChatStore.getState().selectedChatId;
      if (openChatId === message.chatId) return;

      playIncoming(message.chatId);
    });
    return () => {
      unsubOnline();
      unsubOffline();
      unsubStatus();
      unsubNewMessage();
    };
  }, [isAuthenticated, playIncoming]);

  // Load blocked users from server and subscribe to "you were blocked" real-time event
  useEffect(() => {
    if (!isAuthenticated) return;
    const { setBlockedUsers, addBlockedByUser } = usePrivacySettingsStore.getState();
    let cancelled = false;
    (async () => {
      try {
        const list = await settingsService.getBlockedUsers();
        if (cancelled) return;
        if (Array.isArray(list)) {
          setBlockedUsers(list.map((u) => u.id));
        }
      } catch {
        // ignore
      }
    })();
    const unsubBlocked = onSocketEvent("user:blocked-you", (data: { byUserId?: string }) => {
      if (data?.byUserId) addBlockedByUser(data.byUserId);
    });
    const unsubUnblocked = onSocketEvent("user:unblocked-you", (data: { byUserId?: string }) => {
      if (data?.byUserId) {
        usePrivacySettingsStore.getState().removeBlockedByUser(data.byUserId);
        useChatsStore.getState().setChatBlockedByThem(data.byUserId, false);
      }
    });
    return () => {
      cancelled = true;
      unsubBlocked();
      unsubUnblocked();
    };
  }, [isAuthenticated]);

  // Ensure Soroush has at least Ali in contacts (dev seed convenience)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.phone !== "+989123456789") return;
    let cancelled = false;
    (async () => {
      try {
        const contacts = await contactService.getContacts();
        if (cancelled) return;
        if (Array.isArray(contacts) && contacts.length === 0) {
          await contactService.addContact("+989000000002");
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.phone]);

  const {
    setAddContactOpen,
    setSearchOpen,
    setCreateGroupOpen,
    setCreateChannelOpen,
  } = useModalStore();
  const { setOpen: setSettingsOpen } = useSettingsStore();
  const { selectedChatId, setSelectedChatId } = useChatStore();
  const chats = useChatsStore((s) => s.chats);
  const STORIES_HEIGHT = 120;
  const COLLAPSE_SCROLL_THRESHOLD = 4;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(storiesCollapsed);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);
  const hasScrolledToTopRef = useRef(false);
  const wasChatOpenRef = useRef(false);

  collapsedRef.current = storiesCollapsed;

  // Keep sidebar at top when opening chat page and when chats first load (no auto-scroll to bottom)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (chats.length > 0 && !hasScrolledToTopRef.current) {
      hasScrolledToTopRef.current = true;
      el.scrollTop = 0;
    }
  }, [chats.length]);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const isChatOpen = Boolean(selectedChatId);
    const wasChatOpen = wasChatOpenRef.current;

    if (isChatOpen && !wasChatOpen) {
      window.history.pushState({ spotichatChatOpen: true }, "", window.location.href);
    }

    wasChatOpenRef.current = isChatOpen;
  }, [selectedChatId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key !== "Escape") return;
      if (!useChatStore.getState().selectedChatId) return;
      setSelectedChatId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setSelectedChatId]);

  useEffect(() => {
    const onPopState = () => {
      if (!useChatStore.getState().selectedChatId) return;
      setSelectedChatId(null);
      wasChatOpenRef.current = false;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setSelectedChatId]);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const top = target.scrollTop;

    if (top > COLLAPSE_SCROLL_THRESHOLD && !storiesCollapsed) {
      setStoriesCollapsed(true);
    }
  };

  // Wheel با passive: false تا preventDefault کار کند و استوری دوباره باز شود
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const atTop = el.scrollTop <= 0;
      if (atTop && collapsedRef.current && e.deltaY < 0) {
        e.preventDefault();
        setStoriesCollapsed(false);
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget;
    touchStartScrollTop.current = target.scrollTop;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartScrollTop.current > 2 || !collapsedRef.current) return;
    const currentY = e.touches[0].clientY;
    const pullDown = currentY - touchStartY.current;
    if (pullDown > 50) {
      setStoriesCollapsed(false);
    }
  };

  const connectionStatus = useConnectionStatusStore((s) => s.status);
  const showStatusSpinner =
    connectionStatus === "offline" ||
    connectionStatus === "connecting" ||
    connectionStatus === "updating";
  const connectionLabel =
    connectionStatus === "offline"
      ? "Waiting for network..."
      : connectionStatus === "connecting"
      ? "Connecting..."
      : connectionStatus === "updating"
      ? "Updating..."
      : "SpotiChat";

  return (
    <div
      className="relative flex w-full overflow-hidden bg-background"
      style={{ height: "var(--app-height, 100dvh)" }}
    >
      {/* Sidebar - Hidden on small screens if chat is open, but for skeleton, just show standard structure */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col bg-sidebar text-sidebar-foreground z-20 ${selectedChatId ? "hidden md:flex" : "flex"}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border gap-2 relative overflow-hidden">
          {!isSearchExpanded ? (
            // Collapsed State: Menu + Branding + Search Icon
            <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
              <div className="flex items-center gap-3 justify-center ">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
              <div className="font-semibold text-lg tracking-tight select-none flex items-center gap-2">
                {showStatusSpinner && (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent opacity-80"
                    aria-hidden
                  />
                )}
                <span
                  key={connectionStatus}
                  className={`inline-block transition-all duration-250 ease-out ${
                    connectionStatus === "connected"
                      ? "opacity-100"
                      : "opacity-90 text-muted-foreground"
                  } animate-in fade-in`}
                >
                  {connectionLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-accent/30 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => setIsSearchExpanded(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Expanded State: Back Button + Search Input
            <div className="flex items-center w-full gap-2 animate-in slide-in-from-right-4 fade-in duration-200">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground shrink-0 rounded-full hover:bg-accent"
                onClick={() => setIsSearchExpanded(false)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className="relative flex-1 cursor-pointer group"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <Input
                  placeholder="Search"
                  className="pl-9 pr-4 bg-accent/60 border-none h-10 w-full rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:bg-background transition-all pointer-events-none"
                  readOnly
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 w-full min-h-0 overflow-hidden flex flex-col relative">
          <div
            ref={scrollContainerRef}
            className="flex-1 w-full overflow-y-auto"
            onScroll={handleScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            {/*
              Stories behave like Telegram:
              - Fully visible when at very top
              - As soon as the user scrolls down a little, they collapse completely.
            */}
            {/*
              We treat "any scroll > 4px" as collapsed for a snappy feel.
            */}
            {/*
              Derive a simple boolean instead of partial collapse state.
            */}
            {/*
              collapsed === true => height 0, opacity 0 (hidden)
              collapsed === false => full height & opacity (visible)
            */}
            {/* Stories row */}
            <div
              className="px-2 pt-2 bg-sidebar text-sidebar-foreground"
              style={{
                height: storiesCollapsed ? 0 : STORIES_HEIGHT,
                opacity: storiesCollapsed ? 0 : 1,
                transition:
                  "height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.25s ease-out",
                overflow: "hidden",
              }}
            >
              <Stories />
            </div>
            {/* Chat list */}
            <div>
              <ChatList />
            </div>
          </div>
        </div>

        {/* Floating Action Button with Dropdown */}
        <div className="absolute bottom-6 right-6 md:left-[18.5rem] md:right-auto lg:left-[19.5rem] z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg cursor-pointer hover:bg-primary/80"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 mb-2 rounded-xl border-none shadow-lg bg-card/95 backdrop-blur-md p-1 pb-1"
            >
              <DropdownMenuItem
                className="flex gap-3 cursor-pointer p-3 rounded-lg"
                onClick={() => setAddContactOpen(true)}
              >
                <UserPlus className="h-4 w-4" />
                <span>New Contact</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-3 cursor-pointer p-3 rounded-lg"
                onClick={() => setCreateGroupOpen(true)}
              >
                <Users className="h-4 w-4" />
                <span>New Group</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-3 cursor-pointer p-3 rounded-lg"
                onClick={() => setCreateChannelOpen(true)}
              >
                <Hash className="h-4 w-4" />
                <span>New Channel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`absolute inset-x-0 z-30 flex min-w-0 flex-col bg-background transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)] motion-reduce:transition-none md:static md:inset-auto md:z-10 md:w-auto md:min-h-0 md:flex-1 md:translate-x-0 ${
          selectedChatId
            ? "pointer-events-auto"
            : "translate-x-full pointer-events-none md:pointer-events-auto"
        }`}
        style={{
          height: "var(--app-height, 100dvh)",
          top: "var(--app-top-offset, 0px)",
        }}
      >
        <Outlet />
      </div>

      <ModalProvider />
    </div>
  );
}
