import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, ImageIcon, Phone, Ban, UserX, UserPlus, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { User } from '@/services/auth.service';
import { usePrivacySettingsStore } from '@/features/settings/store/privacy.store';
import { contactService } from '@/services/contact.service';
import { settingsService } from '@/services/settings.service';

interface ChatProfileSheetProps {
  user: User | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatProfileSheet({ user, isOpen, onOpenChange }: ChatProfileSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showSharedMedia, setShowSharedMedia] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isInContacts, setIsInContacts] = useState<boolean | null>(null);
  const [contactRecordId, setContactRecordId] = useState<string | null>(null);
  const [isAddContactLoading, setIsAddContactLoading] = useState(false);

  const { blockedUserIds, blockedByUserIds, setBlockedUsers } = usePrivacySettingsStore();
  const hasBlockedMe = user ? blockedByUserIds.includes(user.id) : false;

  // Resolve whether this user is in our contacts (for Remove vs Add to contacts)
  useEffect(() => {
    if (!user?.id || !isOpen) {
      setIsInContacts(null);
      setContactRecordId(null);
      return;
    }
    let mounted = true;
    contactService
      .getContacts()
      .then((list) => {
        if (!mounted || !Array.isArray(list)) return;
        const contact = list.find((c: { contactId?: string }) => c.contactId === user.id);
        setIsInContacts(!!contact);
        setContactRecordId(contact ? (contact as { id: string }).id : null);
      })
      .catch(() => {
        if (mounted) {
          setIsInContacts(false);
          setContactRecordId(null);
        }
      });
    return () => {
      mounted = false;
    };
  }, [user?.id, isOpen]);

  // Mock data for photo gallery based on user
  const photos = user ? [
    { url: user.avatar, date: 'Today at 10:42 AM' },
    { url: 'https://i.pravatar.cc/600?img=1', date: 'March 1, 2026' },
    { url: 'https://i.pravatar.cc/600?img=2', date: 'February 15, 2026' },
  ] : [];

  // Mock shared media images
  const sharedMedia = Array.from({ length: 15 }).map((_, i) => `https://picsum.photos/seed/${user?.id || 'user'}_${i}/300/300`);

  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop;
      // Max scroll distance for transformation (e.g., 100px)
      const maxScroll = 120;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      setScrollProgress(progress);
    }
  };

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!user) return null;

  // Calculate dynamic styles based on scroll progress
  // Avatar shrinks and header height shrinks
  const avatarSize = 96 - scrollProgress * 56; // 96px to 40px
  const headerOpacity = 0.2 + scrollProgress * 0.8; // background opacity increases

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="!w-full !max-w-full sm:!max-w-[400px] p-0 flex flex-col h-[100dvh] bg-background border-none sm:border-l overflow-hidden">
        {/* Back Button for Mobile/Full-screen */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 left-4 z-20 text-muted-foreground hover:text-foreground"
          onClick={() => showSharedMedia ? setShowSharedMedia(false) : onOpenChange(false)}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        {/* Sticky Header that morphs slightly */}
        {!showSharedMedia && (
          <div 
            className="absolute top-0 left-0 right-0 z-10 flex flex-col items-center justify-end px-4 backdrop-blur-md transition-all duration-0"
            style={{ 
              height: `${220 - scrollProgress * 160}px`,
              backgroundColor: `hsl(var(--muted) / ${headerOpacity})`,
              borderColor: `rgba(var(--border), ${scrollProgress})`
            }}
          >
          {/* Close button could go here or we rely on clicking outside SheetContent as usual */}
          
          <div 
            className="flex flex-col items-center transition-all duration-0 absolute"
            style={{
               bottom: `${16 + scrollProgress * 12}px`,
               transform: `scale(${1 - scrollProgress * 0.1})`
            }}
          >
             {/* This Avatar is visually separate but tied to scroll */}
             <Avatar 
               className="mb-3 transition-all duration-0 cursor-pointer"
               style={{
                 width: `${avatarSize}px`,
                 height: `${avatarSize}px`,
                 borderRadius: `${30 + scrollProgress * 20}%`,
               }}
               onClick={() => !hasBlockedMe && setIsViewerOpen(true)}
             >
               <AvatarImage src={hasBlockedMe ? undefined : user.avatar} className="object-cover" />
               <AvatarFallback className="text-2xl transition-all" style={{ fontSize: `${24 - scrollProgress * 10}px` }}>{user.name.charAt(0)}</AvatarFallback>
             </Avatar>
             
             <div className="flex flex-col items-center">
               <h2 
                 className="font-semibold transition-all duration-0"
                 style={{ 
                   fontSize: `${20 - scrollProgress * 4}px`,
                   lineHeight: 1.2
                 }}
               >
                 {user.name}
               </h2>
               <span 
                 className="text-muted-foreground transition-all duration-0 overflow-hidden"
                 style={{ 
                   fontSize: '14px',
                   opacity: 1 - scrollProgress,
                   height: `${20 * (1 - scrollProgress)}px`,
                   marginTop: `${4 * (1 - scrollProgress)}px`
                 }}
               >
                 {hasBlockedMe ? 'last seen a long time ago' : 'last seen recently'}
               </span>
             </div>
          </div>
        </div>
        )}

        {!showSharedMedia ? (
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 w-full h-full overflow-y-auto custom-scrollbar relative"
        >
           {/* Spacer for sticky header */}
           <div style={{ height: '220px' }} />

           {hasBlockedMe ? (
             <div className="px-6 py-8 text-center text-muted-foreground text-sm">
               This profile is not available to you.
             </div>
           ) : (
           <>
           <div className="flex justify-center gap-6 py-4 px-6 bg-card">
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-2 hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                <Phone className="h-5 w-5" />
                <span className="text-xs">Call</span>
              </Button>
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-2 hover:bg-accent/50 text-muted-foreground hover:text-foreground">
                <Video className="h-5 w-5" />
                <span className="text-xs">Video</span>
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
                          <div 
                className="px-5 py-3 flex items-center gap-4 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setShowSharedMedia(true)}
              >
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <span className="text-[15px]">Shared Media</span>
                <span className="ml-auto text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">{sharedMedia.length}</span>
              </div>
              
              <Separator className="my-2" />

              {/* Danger Actions */}
              {blockedUserIds.includes(user.id) ? (
                <div
                  className="px-5 py-3 flex items-center gap-4 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                  onClick={async () => {
                    try {
                      await settingsService.unblockUser(user.id);
                      setBlockedUsers(blockedUserIds.filter((id) => id !== user.id));
                    } catch {
                      // keep state on error
                    }
                  }}
                >
                  <Ban className="h-5 w-5" />
                  <span className="text-[15px]">Unblock User</span>
                </div>
              ) : (
                <div
                  className="px-5 py-3 flex items-center gap-4 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                  onClick={() => setIsBlockDialogOpen(true)}
                >
                  <Ban className="h-5 w-5" />
                  <span className="text-[15px]">Block User</span>
                </div>
              )}
              
              {isInContacts === true ? (
                <div
                  className="px-5 py-3 flex items-center gap-4 hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                  onClick={() => setIsRemoveDialogOpen(true)}
                >
                  <UserX className="h-5 w-5" />
                  <span className="text-[15px]">Remove Contact</span>
                </div>
              ) : isInContacts === false ? (
                <div
                  className="px-5 py-3 flex items-center gap-4 hover:bg-primary/10 text-primary transition-colors cursor-pointer"
                  onClick={async () => {
                    if (!user) return;
                    setIsAddContactLoading(true);
                    try {
                      await contactService.addContactByUserId(user.id);
                      const list = await contactService.getContacts();
                      const contact = Array.isArray(list)
                        ? list.find((c: { contactId?: string }) => c.contactId === user.id)
                        : null;
                      setIsInContacts(true);
                      setContactRecordId(contact ? (contact as { id: string }).id : null);
                    } catch {
                      // keep state as not in contacts
                    } finally {
                      setIsAddContactLoading(false);
                    }
                  }}
                >
                  <UserPlus className="h-5 w-5" />
                  <span className="text-[15px]">
                    {isAddContactLoading ? 'Adding...' : 'Add to contacts'}
                  </span>
                </div>
              ) : null}
            </div>
           </>
           )}
          </div>
        ) : (
          /* Shared Media View */
          <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-2 duration-200">
            <div className="flex items-center gap-4 p-4 border-b bg-card/50 min-h-[72px]">
              <div className="w-10 shrink-0" /> {/* Spacer for global back button */}
              <div className="flex flex-col">
                <span className="font-semibold px-1">Shared Media</span>
                <span className="text-xs text-muted-foreground px-1">{sharedMedia.length} photos</span>
              </div>
            </div>
            
            <ScrollArea className="flex-1 w-full">
              <div className="grid grid-cols-3 gap-1 p-1">
                {sharedMedia.map((url, i) => (
                  <div key={i} className="aspect-square relative group bg-muted cursor-pointer overflow-hidden">
                    <img 
                      src={url} 
                      alt={`Shared media ${i}`} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </SheetContent>

      {/* Profile Photo Viewer UI */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none shadow-2xl overflow-hidden [&>button]:hidden h-[100dvh] sm:h-[85vh] w-full flex flex-col rounded-none sm:rounded-xl">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10 shrink-0" onClick={() => setIsViewerOpen(false)}>
                <X className="h-6 w-6" />
              </Button>
              <div className="flex flex-col">
                 <span className="text-white font-medium">Profile Photo</span>
                 <span className="text-white/70 text-sm">{photos[currentPhotoIndex]?.date}</span>
              </div>
            </div>
            <div className="text-white/80 text-sm font-medium pr-2">
              {currentPhotoIndex + 1} of {photos.length}
            </div>
          </div>

          <DialogTitle className="sr-only">Profile Photo of {user.name}</DialogTitle>
          <DialogDescription className="sr-only">View and navigate profile photos</DialogDescription>

          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center relative w-full h-full min-h-0 select-none touch-none">
            <img 
              src={photos[currentPhotoIndex]?.url} 
              alt={`Profile ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-200"
            />
            
            {/* Nav Overlays - Clickable areas taking up sides */}
            {photos.length > 1 && (
              <>
                <div 
                  className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-start group"
                  onClick={() => setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)}
                >
                   <div className="h-14 w-14 rounded-full bg-black/20 text-white flex items-center justify-center ml-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm sm:flex hidden">
                     <ChevronLeft className="h-8 w-8" />
                   </div>
                </div>
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer flex items-center justify-end group"
                  onClick={() => setCurrentPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)}
                >
                   <div className="h-14 w-14 rounded-full bg-black/20 text-white flex items-center justify-center mr-4 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm sm:flex hidden">
                     <ChevronRight className="h-8 w-8" />
                   </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Block user confirm dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Block {user.name}?</DialogTitle>
          <DialogDescription>
            They will no longer be able to send you messages or call you. You
            can unblock them later from Settings &gt; Privacy &amp; Security &gt;
            Blocked Users.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await settingsService.blockUser(user.id);
                  if (!blockedUserIds.includes(user.id)) {
                    setBlockedUsers([...blockedUserIds, user.id]);
                  }
                } catch {
                  // keep dialog open on error
                }
                setIsBlockDialogOpen(false);
                onOpenChange(false);
              }}
            >
              Block User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove contact confirm dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Remove {user.name} from contacts?</DialogTitle>
          <DialogDescription>
            This will remove the contact from your list but won&apos;t delete the
            chat history.
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (contactRecordId) {
                  try {
                    await contactService.removeContact(contactRecordId);
                    setIsInContacts(false);
                    setContactRecordId(null);
                  } catch {
                    // keep dialog open on error
                  }
                }
                setIsRemoveDialogOpen(false);
                onOpenChange(false);
              }}
            >
              Remove Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
