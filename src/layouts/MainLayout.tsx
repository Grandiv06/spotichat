import { Outlet } from 'react-router-dom';
import { Moon, Sun, Plus, Menu, Search, Settings } from 'lucide-react';
import { useThemeStore } from '@/store/theme.store';
import { useModalStore } from '@/store/modal.store';
import { useSettingsStore } from '@/features/settings/store/settings.store';
import { useChatStore } from '@/store/chat.store';
import { ChatList } from '@/features/chat/ChatList';
import { ModalProvider } from '@/features/modals/ModalProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

export function MainLayout() {
  const { theme, setTheme } = useThemeStore();
  const { setAddContactOpen, setSearchOpen } = useModalStore();
  const { setOpen: setSettingsOpen } = useSettingsStore();
  const { selectedChatId } = useChatStore();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Sidebar - Hidden on small screens if chat is open, but for skeleton, just show standard structure */}
      <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border flex flex-col bg-sidebar text-sidebar-foreground z-20 ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSettingsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSettingsOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="relative flex-1 cursor-pointer" onClick={() => setSearchOpen(true)}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search" 
              className="pl-9 bg-accent/50 border-none h-9 focus-visible:ring-1 pointer-events-none" 
              readOnly
            />
          </div>
          
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Chat List */}
        <ScrollArea className="flex-1 w-full flex flex-col">
          <ChatList />
        </ScrollArea>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 left-6 md:left-[21rem] lg:left-[22rem] z-30">
           <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" onClick={() => setAddContactOpen(true)}>
             <Plus className="h-6 w-6" />
           </Button>
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
