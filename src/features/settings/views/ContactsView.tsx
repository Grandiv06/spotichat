import { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { mockedContacts } from '../mock/settings.mock';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type Contact = (typeof mockedContacts)[number];

export function ContactsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>(mockedContacts);
  const [viewContact, setViewContact] = useState<Contact | null>(null);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formState, setFormState] = useState<
    Pick<Contact, 'name' | 'phone' | 'username'>
  >({
    name: '',
    phone: '',
    username: '',
  });

  const isEditing = !!editContact;

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const resetForm = () => {
    setFormState({ name: '', phone: '', username: '' });
    setEditContact(null);
  };

  const openEdit = (contact: Contact) => {
    setEditContact(contact);
    setFormState({
      name: contact.name,
      phone: contact.phone,
      username: contact.username,
    });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleSave = () => {
    if (!formState.name.trim() || !formState.phone.trim()) return;

    if (isEditing && editContact) {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editContact.id ? { ...c, ...formState } : c
        )
      );
    } else {
      const newContact: Contact = {
        id: Date.now().toString(),
        lastSeen: 'last seen recently',
        avatar: '',
        ...formState,
      };
      setContacts((prev) => [newContact, ...prev]);
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
          {filteredContacts.map((contact) => (
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
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
          {filteredContacts.length === 0 && (
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
                {viewContact.username && (
                  <p className="text-sm text-muted-foreground">
                    {viewContact.username}
                  </p>
                )}
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
                placeholder="+1 234 567 890"
                value={formState.phone}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactUsername">Username (optional)</Label>
              <Input
                id="contactUsername"
                placeholder="@username"
                value={formState.username}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
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
              disabled={!formState.name.trim() || !formState.phone.trim()}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
