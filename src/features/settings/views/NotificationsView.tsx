import { useState, useEffect } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Switch } from '@/components/ui/switch';
import { mockedNotificationSettings } from '../mock/settings.mock';
import { getSendSound, setSendSound, playSendSound, playCallNotificationSound, type SendSoundId } from '@/lib/sounds';

export function NotificationsView() {
  const [settings, setSettings] = useState(mockedNotificationSettings);
  const [sendSound, setSendSoundState] = useState<SendSoundId>('ding');
  const [callSoundEnabled, setCallSoundEnabled] = useState(true);

  useEffect(() => {
    setSendSoundState(getSendSound());
  }, []);

  const handleToggle = (key: keyof typeof mockedNotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const soundOptions: { id: SendSoundId; label: string }[] = [
    { id: 'ding', label: 'Ding (default)' },
    { id: 'bubble', label: 'Bubble' },
    { id: 'ping', label: 'Ping' },
    { id: 'click', label: 'Click' },
    { id: 'chord', label: 'Chord' },
    { id: 'retro', label: 'Retro' },
    { id: 'soft', label: 'Soft' },
    { id: 'spark', label: 'Spark' },
    { id: 'drop', label: 'Drop' },
    { id: 'pop', label: 'Pop' },
    { id: 'bell', label: 'Bell' },
    { id: 'pluck', label: 'Pluck' },
    { id: 'glass', label: 'Glass' },
    { id: 'rise', label: 'Rise' },
    { id: 'fall', label: 'Fall' },
    { id: 'pulse', label: 'Pulse' },
    { id: 'telegram', label: 'Telegram (file)' },
  ];

  const handleSelectSendSound = (id: SendSoundId) => {
    setSendSound(id);
    setSendSoundState(id);
    if (id !== 'none') {
      // Small delay so the user clearly hears the chosen sound
      setTimeout(() => playSendSound(), 40);
    }
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
        {soundOptions.map((opt) => (
          <SettingsRow
            key={opt.id}
            label={opt.label}
            description={opt.id === 'telegram' ? 'Uses /sounds/telegram-send.mp3' : undefined}
            onClick={() => handleSelectSendSound(opt.id)}
            rightElement={
              <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
                {sendSound === opt.id && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            }
          />
        ))}
        <SettingsRow
          label="Off"
          description="Disable send sound"
          onClick={() => handleSelectSendSound('none')}
          rightElement={
            <div className="w-4 h-4 rounded-full border border-primary flex items-center justify-center">
              {sendSound === 'none' && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </div>
          }
        />
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
