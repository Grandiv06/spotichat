import { useState, useEffect } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical, Ban, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { contactService } from '@/services/contact.service';
import { settingsService } from '@/services/settings.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { usePrivacySettingsStore } from '../store/privacy.store';
import { Label } from '@/components/ui/label';

export type ContactItem = {
  id: string;
  contactId: string;
  name: string;
  phone: string;
  username?: string;
  avatar?: string;
  lastSeen?: string;
};

export function ContactsView() {
  const { blockedUserIds, setBlockedUsers } = usePrivacySettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewContact, setViewContact] = useState<ContactItem | null>(null);
  const [editContact, setEditContact] = useState<ContactItem | null>(null);
  const [blockTarget, setBlockTarget] = useState<ContactItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formState, setFormState] = useState<{ name: string; phone: string }>({
    name: '',
    phone: '',
  });

  const isEditing = !!editContact;

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    contactService
      .getContacts()
      .then((data) => {
        if (!mounted) return;
        setContacts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setContacts([]);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery))
  );

  const resetForm = () => {
    setFormState({ name: '', phone: '' });
    setEditContact(null);
  };

  const openEdit = (contact: ContactItem) => {
    setEditContact(contact);
    setFormState({
      name: contact.name,
      phone: contact.phone,
    });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formState.phone.trim()) return;

    if (isEditing && editContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editContact.id ? { ...c, name: formState.name, phone: formState.phone } : c
        )
      );
    } else {
      try {
        const added = (await contactService.addContact(formState.phone)) as {
          id: string;
          contactId: string;
          name: string;
          phone: string;
          avatar?: string;
        };
        setContacts((prev) => [
          { ...added, lastSeen: 'recently' } as ContactItem,
          ...prev,
        ]);
      } catch {
        // keep dialog open on error; caller could show toast
      }
    }

    setIsAddOpen(false);
    resetForm();
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
      <div className="px-4 py-3 sticky top-0 bg-background/95 backdrop-blur z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-accent/50 border-none h-10"
          />
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-primary border-primary/20 bg-primary/5 hover:bg-primary/10"
          onClick={openAdd}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Contact
        </Button>
      </div>

      <div className="px-4 py-2 flex-1">
        <SettingsSection title={`All Contacts (${contacts.length})`}>
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Loading contacts...
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <SettingsRow
                key={contact.id}
                label={contact.name}
                description={contact.lastSeen}
                icon={
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                }
                rightElement={
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewContact(contact);
                        }}
                      >
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(contact);
                        }}
                      >
                        Edit Contact
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBlockTarget(contact);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(contact);
                        }}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                }
              />
            ))
          )}
          {!isLoading && filteredContacts.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No contacts found.
            </div>
          )}
        </SettingsSection>
      </div>

      {/* View profile dialog */}
      <Dialog
        open={!!viewContact}
        onOpenChange={(open) => {
          if (!open) setViewContact(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Contact Info</DialogTitle>
          </DialogHeader>
          {viewContact && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={viewContact.avatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {viewContact.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center">
                <p className="text-base font-semibold">{viewContact.name}</p>
                <p className="text-sm text-muted-foreground">
                  {viewContact.phone}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {viewContact.lastSeen}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit contact dialog */}
      <Dialog
        open={isAddOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false);
            resetForm();
          } else {
            setIsAddOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Contact' : 'Add New Contact'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Name</Label>
              <Input
                id="contactName"
                placeholder="Contact name"
                value={formState.name}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Phone Number</Label>
              <Input
                id="contactPhone"
                placeholder="09123456789"
                value={formState.phone}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formState.phone.trim()}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Block user confirmation */}
      <Dialog open={!!blockTarget} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Block {blockTarget?.name}?</DialogTitle>
            <DialogDescription>
              They will no longer be able to send you messages or call you. You can unblock them
              later from Settings &gt; Privacy &amp; Security &gt; Blocked Users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!blockTarget) return;
                try {
                  await settingsService.blockUser(blockTarget.contactId);
                  if (!blockedUserIds.includes(blockTarget.contactId)) {
                    setBlockedUsers([...blockedUserIds, blockTarget.contactId]);
                  }
                } catch {
                  // keep dialog open on error
                }
                setBlockTarget(null);
              }}
            >
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user / Remove contact confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name} from contacts?</DialogTitle>
            <DialogDescription>
              This will remove them from your contact list. Your chat history will not be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await contactService.removeContact(deleteTarget.id);
                  setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
                  setDeleteTarget(null);
                } catch {
                  // keep modal open on error
                }
              }}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
