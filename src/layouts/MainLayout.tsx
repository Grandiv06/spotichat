import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus, Menu, Search, ArrowLeft, Users, Hash, UserPlus } from 'lucide-react';
import { useModalStore } from '@/store/modal.store';
import { useSettingsStore } from '@/features/settings/store/settings.store';
import { useChatStore } from '@/store/chat.store';
import { ChatList } from '@/features/chat/ChatList';
import { ModalProvider } from '@/features/modals/ModalProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export function MainLayout() {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { setAddContactOpen, setSearchOpen, setCreateGroupOpen, setCreateChannelOpen } = useModalStore();
  const { setOpen: setSettingsOpen } = useSettingsStore();
  const { selectedChatId } = useChatStore();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Sidebar - Hidden on small screens if chat is open, but for skeleton, just show standard structure */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col bg-sidebar text-sidebar-foreground z-20 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border gap-2 relative overflow-hidden">
          {!isSearchExpanded ? (
            // Collapsed State: Menu + Branding + Search Icon
            <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSettingsOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSettingsOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="font-semibold text-lg tracking-tight select-none">SpotiChat</div>
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
              <div className="relative flex-1 cursor-pointer group" onClick={() => setSearchOpen(true)}>
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
        
        {/* Chat List */}
        <ScrollArea className="flex-1 w-full flex flex-col">
          <ChatList />
        </ScrollArea>

        {/* Floating Action Button with Dropdown */}
        <div className="absolute bottom-6 left-6 md:left-[18.5rem] lg:left-[19.5rem] z-30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="h-14 w-14 rounded-full shadow-lg cursor-pointer hover:bg-primary/80">
                <Plus className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2 rounded-xl border-none shadow-lg bg-card/95 backdrop-blur-md p-1 pb-1">
              <DropdownMenuItem className="flex gap-3 cursor-pointer p-3 rounded-lg" onClick={() => setAddContactOpen(true)}>
                <UserPlus className="h-4 w-4" />
                <span>New Contact</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-3 cursor-pointer p-3 rounded-lg" onClick={() => setCreateGroupOpen(true)}>
                <Users className="h-4 w-4" />
                <span>New Group</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-3 cursor-pointer p-3 rounded-lg" onClick={() => setCreateChannelOpen(true)}>
                <Hash className="h-4 w-4" />
                <span>New Channel</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-background relative z-10 ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
        <Outlet />
      </div>

      <ModalProvider />
    </div>
  );
}
