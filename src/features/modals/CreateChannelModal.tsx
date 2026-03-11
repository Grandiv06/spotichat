import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalStore } from '@/store/modal.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, Camera, Globe, Lock } from 'lucide-react';

export function CreateChannelModal() {
  const { isCreateChannelOpen, setCreateChannelOpen } = useModalStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2
  const [isPrivate, setIsPrivate] = useState(false);
  
  // Step 3
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);

  // Mock Contacts for Selection
  const mockContacts = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    phone: `+1 555 010${i}`,
    avatar: `https://i.pravatar.cc/150?u=${i + 20}`
  }));

  const toggleContact = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    console.log('Channel Created:', { name: channelName, description, isPrivate, subscribers: selectedContacts });
    
    // Reset and close
    setChannelName('');
    setDescription('');
    setIsPrivate(false);
    setSelectedContacts([]);
    setStep(1);
    setCreateChannelOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep(1);
      setChannelName('');
      setDescription('');
      setIsPrivate(false);
      setSelectedContacts([]);
    }
    setCreateChannelOpen(open);
  };

  const getTitle = () => {
    if (step === 1) return 'New Channel';
    if (step === 2) return 'Channel Type';
    return 'Add Subscribers';
  };

  return (
    <Dialog open={isCreateChannelOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px] p-6 space-y-6">
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary/20 transition-colors border border-primary/20">
                <Camera className="h-8 w-8 text-primary/70" />
              </div>
              <Label htmlFor="channelName" className="sr-only">Channel Name</Label>
              <Input 
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel Name" 
                className="text-center text-lg font-medium border-x-0 border-t-0 rounded-none border-b-2 border-muted focus-visible:border-primary focus-visible:ring-0 px-0 h-10 bg-transparent w-full shadow-none mb-4"
                autoFocus
              />
              <Label htmlFor="channelDesc" className="sr-only">Description</Label>
              <Input 
                id="channelDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)" 
                className="text-center text-sm border-x-0 border-t-0 rounded-none border-b border-muted focus-visible:border-primary focus-visible:ring-0 px-0 h-8 bg-transparent w-full shadow-none"
              />
            </div>
            
            <div className="flex-1" />
            
            <div className="flex justify-end w-full">
               <Button 
                onClick={() => setStep(2)} 
                disabled={!channelName.trim()}
                className="rounded-full px-6"
               >
                 Next
               </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px]">
            <div className="flex flex-col space-y-4 p-4">
              <div 
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border ${!isPrivate ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => setIsPrivate(false)}
              >
                <Globe className={`h-6 w-6 mt-0.5 ${!isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[15px]">Public Channel</span>
                  <span className="text-sm text-muted-foreground leading-snug">Public channels can be found in search, anyone can join them.</span>
                </div>
              </div>

              <div 
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border ${isPrivate ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => setIsPrivate(true)}
              >
                <Lock className={`h-6 w-6 mt-0.5 ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[15px]">Private Channel</span>
                  <span className="text-sm text-muted-foreground leading-snug">Private channels can only be joined via invite link.</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1" />
            
            <div className="p-4 border-t bg-muted/10 flex justify-between items-center w-full">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Back</Button>
              <Button onClick={() => setStep(3)} className="rounded-full px-6">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px]">
             <div className="p-3 border-b border-border/50 text-sm text-muted-foreground font-medium bg-muted/30">
              {selectedContacts.length} subscribers selected
            </div>
            
            <ScrollArea className="flex-1 w-full">
              <div className="flex flex-col py-2">
                {mockContacts.map(contact => (
                  <div 
                    key={contact.id} 
                    className="flex items-center gap-3 px-4 py-2 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => toggleContact(contact.id)}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarImage src={contact.avatar} />
                        <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {selectedContacts.includes(contact.id) && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1 truncate">
                      <span className="font-medium text-sm truncate">{contact.name}</span>
                      <span className="text-xs text-muted-foreground truncate">last seen recently</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t bg-muted/10 flex justify-between items-center w-full">
              <Button variant="ghost" onClick={() => setStep(2)} className="rounded-full">Back</Button>
              <Button onClick={handleCreate} className="rounded-full px-6">Create</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
