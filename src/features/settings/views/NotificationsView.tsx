import { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Switch } from '@/components/ui/switch';
import { mockedNotificationSettings } from '../mock/settings.mock';

export function NotificationsView() {
  const [settings, setSettings] = useState(mockedNotificationSettings);

  const handleToggle = (key: keyof typeof mockedNotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
          label="Message Sound" 
          description="Default (Note)"
          rightElement={
            <Switch 
              checked={settings.messageSound} 
              onCheckedChange={() => handleToggle('messageSound')} 
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

      <SettingsSection title="Mute Settings">
        <SettingsRow 
          label="Mute All Chats" 
          rightElement={
            <Switch 
              checked={settings.muteAllChats} 
              onCheckedChange={() => handleToggle('muteAllChats')} 
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
