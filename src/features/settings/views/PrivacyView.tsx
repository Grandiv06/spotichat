import { useState } from 'react';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { mockedPrivacySettings } from '../mock/settings.mock';
import { Lock, ShieldAlert, Phone, Eye, UserX } from 'lucide-react';

export function PrivacyView() {
  const [settings] = useState(mockedPrivacySettings);

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      
      <div className="flex items-center justify-center p-6 text-primary">
        <Lock className="h-16 w-16 opacity-80" />
      </div>

      <SettingsSection title="Privacy">
        <SettingsRow 
          icon={<Phone className="h-5 w-5" />}
          label="Phone Number" 
          description={settings.currentPhoneNumberOption} 
        />
        <SettingsRow 
          icon={<Eye className="h-5 w-5" />}
          label="Last Seen & Online" 
          description={settings.currentLastSeenOption} 
        />
        <SettingsRow 
          icon={<UserX className="h-5 w-5" />}
          label="Profile Photo" 
          description={settings.currentProfilePhotoOption} 
        />
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow 
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Two-Step Verification" 
          description="Off" 
        />
        <SettingsRow 
          icon={<Lock className="h-5 w-5" />}
          label="Passcode Lock" 
          description="Off" 
        />
      </SettingsSection>

      <SettingsSection title="Blocked">
        <SettingsRow 
          label="Blocked Users" 
          description={`${settings.blockedUsers.length} users`} 
        />
      </SettingsSection>
    </div>
  );
}
