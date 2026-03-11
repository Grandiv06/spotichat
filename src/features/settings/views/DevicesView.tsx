import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { mockedDevices } from '../mock/settings.mock';
import { Laptop, Smartphone, Monitor, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DevicesView() {
  const currentDevice = mockedDevices.find(d => d.isCurrent);
  const otherDevices = mockedDevices.filter(d => !d.isCurrent);

  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'laptop': return <Laptop className="h-6 w-6 text-primary" />;
      case 'smartphone': return <Smartphone className="h-6 w-6 text-primary" />;
      case 'monitor': return <Monitor className="h-6 w-6 text-primary" />;
      default: return <Laptop className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      <div className="flex justify-center mb-6 mt-2">
        <Button variant="destructive" className="w-[85%] font-medium">
          <LogOut className="mr-2 h-4 w-4" />
          Terminate All Other Sessions
        </Button>
      </div>

      {currentDevice && (
        <SettingsSection title="Current Session" description="The device you are currently using.">
          <SettingsRow 
            icon={getIcon(currentDevice.icon)}
            label={currentDevice.name} 
            description={`${currentDevice.platform} • ${currentDevice.browser} • ${currentDevice.lastActive}`} 
            rightElement={<span className="text-xs font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">Active</span>}
          />
        </SettingsSection>
      )}

      {otherDevices.length > 0 && (
        <SettingsSection title="Active Sessions" description="Other devices logged into this account.">
          {otherDevices.map(device => (
            <SettingsRow 
              key={device.id}
              icon={getIcon(device.icon)}
              label={device.name} 
              description={`${device.platform} • ${device.browser} • ${device.lastActive}`} 
              rightElement={
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </SettingsSection>
      )}
    </div>
  );
}
