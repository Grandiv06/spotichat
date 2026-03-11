import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModalStore } from '@/store/modal.store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, Camera } from 'lucide-react';

export function CreateGroupModal() {
  const { isCreateGroupOpen, setCreateGroupOpen } = useModalStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');

  // Mock Contacts for Selection
  const mockContacts = Array.from({ length: 15 }).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    phone: `+1 555 010${i}`,
    avatar: `https://i.pravatar.cc/150?u=${i}`
  }));

  const toggleContact = (id: number) => {
    setSelectedContacts(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (selectedContacts.length > 0) setStep(2);
  };

  const handleCreate = () => {
    // Mock create action
    console.log('Group Created:', { name: groupName, members: selectedContacts });
    
    // Reset and close
    setGroupName('');
    setSelectedContacts([]);
    setStep(1);
    setCreateGroupOpen(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep(1);
      setSelectedContacts([]);
      setGroupName('');
    }
    setCreateGroupOpen(open);
  };

  return (
    <Dialog open={isCreateGroupOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle>{step === 1 ? 'Add Members' : 'New Group'}</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex flex-col h-[50dvh] sm:h-[400px]">
            <div className="p-3 border-b border-border/50 text-sm text-muted-foreground font-medium bg-muted/30">
              {selectedContacts.length} / 200000 members
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
            
            <div className="p-4 border-t bg-muted/10 flex justify-end">
               <Button 
                onClick={handleNext} 
                disabled={selectedContacts.length === 0}
                className="rounded-full px-6"
               >
                 Next
               </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[50dvh] sm:h-[400px] p-6 space-y-6">
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary/20 transition-colors border border-primary/20">
                <Camera className="h-8 w-8 text-primary/70" />
              </div>
              <Label htmlFor="groupName" className="sr-only">Group Name</Label>
              <Input 
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group Name" 
                className="text-center text-lg font-medium border-x-0 border-t-0 rounded-none border-b-2 border-muted focus-visible:border-primary focus-visible:ring-0 px-0 h-12 bg-transparent w-3/4 shadow-none"
                autoFocus
              />
            </div>
            
            <div className="flex-1" />
            
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">{selectedContacts.length} members</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Back</Button>
                <Button onClick={handleCreate} disabled={!groupName.trim()} className="rounded-full px-6">Create</Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
