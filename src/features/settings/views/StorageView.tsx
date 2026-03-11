import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Database, Image as ImageIcon, File, HardDrive } from 'lucide-react';

export function StorageView() {
  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-8 ring-primary/5">
          <HardDrive className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-2xl font-bold tracking-tight">452 MB</h3>
        <p className="text-muted-foreground mt-1">Total Cache Size</p>
      </div>

      <SettingsSection title="Storage Usage">
        <SettingsRow 
          icon={<ImageIcon className="h-5 w-5" />}
          label="Photos & Videos" 
          description="340 MB" 
        />
        <SettingsRow 
          icon={<File className="h-5 w-5" />}
          label="Documents & Files" 
          description="112 MB" 
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow 
          icon={<Database className="h-5 w-5" />}
          label="Clear Entire Cache" 
          variant="danger"
          description="Frees up space on your device." 
          onClick={() => alert("Cache cleared!")}
        />
      </SettingsSection>
    </div>
  );
}
