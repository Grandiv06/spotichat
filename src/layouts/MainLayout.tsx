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
import { useAuthStore } from "@/store/auth.store";
import { connectSocket } from "@/lib/socket";
import { chatService } from "@/services/chat.service";
import { apiFetch } from "@/lib/api";
import { useOnlineStore } from "@/store/online.store";
import { ChatList } from "@/features/chat/ChatList";
import { ModalProvider } from "@/features/modals/ModalProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stories } from "@/features/chat/Stories";
import { OnlineRow } from "@/features/chat/OnlineRow";

export function MainLayout() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [storiesCollapsed, setStoriesCollapsed] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Connect WebSocket when user is authenticated (e.g. after refresh)
  useEffect(() => {
    if (!isAuthenticated) return;
    connectSocket();
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
    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [isAuthenticated]);

  const {
    setAddContactOpen,
    setSearchOpen,
    setCreateGroupOpen,
    setCreateChannelOpen,
  } = useModalStore();
  const { setOpen: setSettingsOpen } = useSettingsStore();
  const { selectedChatId } = useChatStore();
  const STORIES_HEIGHT = 120;
  const COLLAPSE_SCROLL_THRESHOLD = 4;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const collapsedRef = useRef(storiesCollapsed);
  const touchStartY = useRef(0);
  const touchStartScrollTop = useRef(0);

  collapsedRef.current = storiesCollapsed;

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

  return (
    <div className="flex h-[100dvh] w-full bg-background overflow-hidden relative">
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
              <div className="font-semibold text-lg tracking-tight select-none">
                SpotiChat
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
            {/* Online users row */}
            <OnlineRow />
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
        className={`flex-1 flex flex-col min-w-0 bg-background relative z-10 ${selectedChatId ? "flex" : "hidden md:flex"}`}
      >
        <Outlet />
      </div>

      <ModalProvider />
    </div>
  );
}
