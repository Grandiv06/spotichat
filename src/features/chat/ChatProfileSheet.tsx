import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ImageIcon, Phone, Ban, UserX, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/services/auth.service';

interface ChatProfileSheetProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatProfileSheet({ user, isOpen, onOpenChange }: ChatProfileSheetProps) {
  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col h-full bg-background border-l">
        <SheetHeader className="p-4 border-b sr-only">
          <SheetTitle>User Profile</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto w-full h-full pb-6 custom-scrollbar">
           {/* Cover / Avatar Section */}
           <div className="flex flex-col items-center pt-8 pb-6 px-4 bg-muted/20">
             <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary/10">
               <AvatarImage src={user.avatar} />
               <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
             </Avatar>
             <h2 className="text-xl font-semibold mb-1">{user.name}</h2>
             <span className="text-sm text-muted-foreground">last seen recently</span>
           </div>
           
           <div className="flex justify-center gap-6 py-4 px-6 border-b border-border bg-card">
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-2 hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                <Phone className="h-5 w-5" />
                <span className="text-xs">Call</span>
              </Button>
           </div>
           
           <div className="flex flex-col py-2">
             {/* Info items */}
             <div className="px-5 py-3 flex gap-4 hover:bg-accent/30 transition-colors">
               <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
               <div className="flex flex-col">
                 <span className="text-[15px]">{user.phone || '+1 234 567 8900'}</span>
                 <span className="text-xs text-muted-foreground">Mobile</span>
               </div>
             </div>
             {user.username && (
               <div className="px-5 py-3 flex gap-4 hover:bg-accent/30 transition-colors">
                 <div className="w-5" /> {/* Empty icon spacer */}
                 <div className="flex flex-col">
                   <span className="text-[15px]">@{user.username}</span>
                   <span className="text-xs text-muted-foreground">Username</span>
                 </div>
               </div>
             )}
             
             <Separator className="my-2" />
             
             {/* Notifications Toggle */}
             <div className="px-5 py-3 flex items-center justify-between hover:bg-accent/30 transition-colors cursor-pointer">
               <div className="flex items-center gap-4">
                 <Bell className="h-5 w-5 text-muted-foreground" />
                 <span className="text-[15px]">Notifications</span>
               </div>
               <Switch defaultChecked />
             </div>
             
             <div className="px-5 py-3 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer">
               <ImageIcon className="h-5 w-5 text-muted-foreground" />
               <span className="text-[15px]">Shared Media</span>
             </div>
             
             <Separator className="my-2" />

             {/* Danger Actions */}
             <div className="px-5 py-3 flex items-center gap-4 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer">
               <Ban className="h-5 w-5" />
               <span className="text-[15px]">Block User</span>
             </div>
             
             <div className="px-5 py-3 flex items-center gap-4 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer">
               <UserX className="h-5 w-5" />
               <span className="text-[15px]">Remove Contact</span>
             </div>
           </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
