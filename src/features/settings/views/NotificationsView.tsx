import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Switch } from '@/components/ui/switch';
import { mockedNotificationSettings } from '../mock/settings.mock';
import { playCallNotificationSound } from '@/lib/sounds';
import { useSettingsStore } from '../store/settings.store';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import {
  MESSAGE_SOUND_OPTIONS,
  type MessageSoundId,
} from '@/lib/notification-sound';
import { Button } from '@/components/ui/button';

export function NotificationsView() {
  const [settings, setSettings] = useState(mockedNotificationSettings);
  const [callSoundEnabled, setCallSoundEnabled] = useState(true);
  const messageSound = useSettingsStore((s) => s.messageSound);
  const setMessageSound = useSettingsStore((s) => s.setMessageSound);
  const muteAllChats = useSettingsStore((s) => s.muteAllChats);
  const setMuteAllChats = useSettingsStore((s) => s.setMuteAllChats);
  const { playPreview } = useNotificationSound();

  useEffect(() => {
    // Keep mocked UI switches in sync for sections that are still local-only.
    setSettings((prev) => ({
      ...prev,
      muteAllChats,
    }));
  }, [muteAllChats]);

  const handleToggle = (key: keyof typeof mockedNotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectMessageSound = (id: MessageSoundId) => {
    setMessageSound(id);
    playPreview(id);
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      <SettingsSection title="Messages">
        <SettingsRow 
          label="Enable Notifications" 
          rightElement={
            <Switch 
              checked={settings.enableNotifications} 
              onCheckedChange={() => handleToggle('enableNotifications')} 
            />
          } 
        />
        <SettingsRow 
          label="Show Message Preview" 
          rightElement={
            <Switch 
              checked={settings.showPreview} 
              onCheckedChange={() => handleToggle('showPreview')} 
            />
          } 
        />
      </SettingsSection>

      <SettingsSection title="Message Sound">
        {MESSAGE_SOUND_OPTIONS.map((opt) => (
          <SettingsRow
            key={opt.id}
            label={opt.label}
            onClick={() => handleSelectMessageSound(opt.id)}
            rightElement={
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    playPreview(opt.id);
                  }}
                  aria-label={`Preview ${opt.label}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                  {messageSound === opt.id && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Call Notifications">
        <SettingsRow
          label="Incoming Call Sound"
          description="Happy bells (mixkit-happy-bells-notification-937)"
          onClick={() => {
            setCallSoundEnabled((prev) => !prev);
            // Preview sound when enabling
            if (!callSoundEnabled) {
              setTimeout(() => playCallNotificationSound(), 40);
            }
          }}
          rightElement={
            <Switch
              checked={callSoundEnabled}
              onCheckedChange={(value) => {
                setCallSoundEnabled(value);
                if (value) {
                  setTimeout(() => playCallNotificationSound(), 40);
                }
              }}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Mute Settings">
        <SettingsRow 
          label="Mute All Chats" 
          rightElement={
            <Switch 
              checked={muteAllChats} 
              onCheckedChange={setMuteAllChats} 
            />
          } 
        />
        <SettingsRow 
          label="Mute Group Chats" 
          rightElement={
            <Switch 
              checked={settings.muteGroupChats} 
              onCheckedChange={() => handleToggle('muteGroupChats')} 
            />
          } 
        />
      </SettingsSection>
    </div>
  );
}
