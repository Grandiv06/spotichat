import { useState, useEffect } from 'react';
import { Search, UserPlus, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { contactService } from '@/services/contact.service';
import { useModalStore } from '@/store/modal.store';
import { useChatStore } from '@/store/chat.store';
import type { User } from '@/services/auth.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SearchUserModal() {
  const { isSearchOpen, setSearchOpen } = useModalStore();
  const { setSelectedChatId } = useChatStore();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await contactService.searchUsers(query);
        setResults(users);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleStartChat = (user: User) => {
    // In a real app we'd create a chat room with user, return its ID and set it.
    // For mock, we pretend the user ID or a mock chat ID is the string
    setSelectedChatId(`new_${user.id}`);
    setSearchOpen(false);
  };

  return (
    <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl h-[80vh] sm:h-auto flex flex-col p-4">
        <DialogHeader className="mb-2">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users by name, @username or ID..." 
            className="pl-9 bg-accent/50 border-transparent focus-visible:ring-1 text-md h-10" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>
        
        <ScrollArea className="flex-1 mt-4 -mx-1 px-1 min-h-[50vh] sm:min-h-[300px]">
          {isSearching ? (
            <div className="flex flex-col gap-2 p-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                   <div className="h-10 w-10 bg-accent rounded-full" />
                   <div className="space-y-2 flex-1">
                     <div className="h-3 bg-accent rounded w-1/3" />
                     <div className="h-3 bg-accent rounded w-1/2" />
                   </div>
                 </div>
               ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => handleStartChat(user)}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.username ? `@${user.username}` : user.phone}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                     <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-10 text-muted-foreground">
               <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
               <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
               <p className="text-sm">Find people to chat with</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
