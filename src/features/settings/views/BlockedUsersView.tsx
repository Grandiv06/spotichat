import { useEffect, useMemo, useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockedContacts } from '../mock/settings.mock';
import { usePrivacySettingsStore } from '../store/privacy.store';
import { useSettingsStore } from '../store/settings.store';
import { Ban, Check } from 'lucide-react';

type Contact = (typeof mockedContacts)[number];

export function BlockedUsersView() {
  const { blockedUsers, setBlockedUsers } = usePrivacySettingsStore();
  const { goBack } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = blockedUsers.map((u) => u.id);
    setSelected(new Set(ids));
  }, [blockedUsers]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mockedContacts;
    return mockedContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.username?.toLowerCase().includes(q),
    );
  }, [search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    const ids = Array.from(selected);
    setBlockedUsers(ids);
    goBack();
  };

  const handleCancel = () => {
    goBack();
  };

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/70 sticky top-0 z-20">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Blocked Users
          </h2>
          <p className="text-xs text-muted-foreground">
            People on this list cannot contact you.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save{selectedCount ? ` (${selectedCount})` : ''}
          </Button>
        </div>
      </div>

      {/* Selected strip + Search */}
      <div className="px-4 pt-3 pb-2 border-b bg-background/95 sticky top-[56px] z-10 space-y-2">
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-1 max-h-24 overflow-y-auto">
            {mockedContacts
              .filter((c) => selected.has(c.id))
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="flex items-center gap-2 rounded-full bg-destructive/10 hover:bg-destructive/15 px-2.5 py-1 text-xs text-destructive-foreground shrink-0 border border-destructive/40"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={c.avatar} />
                    <AvatarFallback className="text-[10px] bg-destructive/10 text-destructive">
                      {c.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate">{c.name}</span>
                  <span className="text-[10px] text-destructive-foreground/80">
                    ×
                  </span>
                </button>
              ))}
          </div>
        )}
        <Input
          placeholder="Search contacts to block"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-accent/40 border-none h-9 text-sm"
        />
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <SettingsSection
          title={`All Contacts (${mockedContacts.length})`}
          description={
            selectedCount
              ? `${selectedCount} blocked contact${selectedCount > 1 ? 's' : ''}`
              : 'Select people you want to block.'
          }
        >
          {filteredContacts.map((contact) => {
            const isSelected = selected.has(contact.id);
            return (
              <SettingsRow
                key={contact.id}
                label={contact.name}
                description={isSelected ? 'Blocked' : contact.lastSeen}
                icon={
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {contact.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                }
                onClick={() => toggle(contact.id)}
                rightElement={
                  <div className="w-5 h-5 rounded-full border border-destructive flex items-center justify-center bg-background">
                    {isSelected && <Check className="h-3 w-3 text-destructive" />}
                  </div>
                }
              />
            );
          })}
          {filteredContacts.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">
              No contacts found.
            </div>
          )}
        </SettingsSection>
      </div>
    </div>
  );
}

