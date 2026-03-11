import { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';

const mockedContacts = [
  { id: '1', name: 'Alice Cooper', phone: '+1234567890', username: '@alice', lastSeen: 'last seen recently', avatar: '' },
  { id: '2', name: 'Bob Smith', phone: '+0987654321', username: '@bobsmith', lastSeen: 'online', avatar: '' },
  { id: '3', name: 'Charlie Brown', phone: '+1122334455', username: '@charlieb', lastSeen: 'last seen 2 hours ago', avatar: '' }
];

export function ContactsView() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredContacts = mockedContacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

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
        <Button variant="outline" className="w-full justify-start text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Contact
        </Button>
      </div>

      <div className="px-4 py-2 flex-1">
        <SettingsSection title={`All Contacts (${mockedContacts.length})`}>
          {filteredContacts.map(contact => (
            <SettingsRow
              key={contact.id}
              label={contact.name}
              description={contact.lastSeen}
              icon={
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary">{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
              }
              rightElement={
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
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
    </div>
  );
}
