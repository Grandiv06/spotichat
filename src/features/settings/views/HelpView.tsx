import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { MessageCircle, Bug, HelpCircle, FileText } from 'lucide-react';

export function HelpView() {
  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 p-4">
      
      <div className="flex items-center justify-center p-6 text-primary">
        <HelpCircle className="h-16 w-16 opacity-80" />
      </div>

      <SettingsSection>
        <SettingsRow 
          icon={<MessageCircle className="h-5 w-5" />}
          label="Ask a Question" 
          description="Chat with our support team" 
        />
        <SettingsRow 
          icon={<Bug className="h-5 w-5" />}
          label="Report a Bug" 
          description="Help us improve SpotiChat" 
        />
        <SettingsRow 
          icon={<FileText className="h-5 w-5" />}
          label="SpotiChat FAQ" 
          description="Read answers to common questions" 
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow 
          label="Privacy Policy" 
        />
        <SettingsRow 
          label="Terms of Service" 
        />
      </SettingsSection>

      <div className="mt-8 flex justify-center text-xs text-muted-foreground">
        SpotiChat Version 1.0.0
      </div>
    </div>
  );
}
