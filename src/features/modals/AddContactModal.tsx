import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { contactService } from '@/services/contact.service';
import { useModalStore } from '@/store/modal.store';

export function AddContactModal() {
  const { isAddContactOpen, setAddContactOpen } = useModalStore();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    setIsLoading(true);
    try {
      await contactService.addContact(phone);
      // In a real app we would add this user to our local chat store/contacts
      setAddContactOpen(false);
      setPhone('');
    } catch (e: any) {
      setError(e.message || 'Error adding contact');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isAddContactOpen} onOpenChange={setAddContactOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Phone Number</Label>
            <Input 
              id="contactPhone" 
              placeholder="+1 234 567 890" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setAddContactOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={isLoading || !phone}>
            {isLoading ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
