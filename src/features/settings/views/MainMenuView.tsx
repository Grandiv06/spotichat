import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '../store/settings.store';
import { useThemeStore } from '@/store/theme.store';
import { SettingsRow } from '../components/SettingsRow';
import { SettingsSection } from '../components/SettingsSection';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Users, 
  Bell, 
  Shield, 
  Smartphone, 
  Database, 
  HelpCircle, 
  LogOut,
  Palette,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MainMenuView() {
  const { user } = useAuthStore();
  const { navigate } = useSettingsStore();
  const { theme, setTheme } = useThemeStore();

  if (!user) return null;

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-300 pb-20">
      
      {/* Profile Header */}
      <div 
        className="flex flex-col items-center justify-center p-6 bg-card/30 mt-2 mb-4 cursor-pointer hover:bg-card/50 transition-colors"
        onClick={() => navigate('profile')}
      >
        <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold tracking-tight">{user.name}</h2>
        {user.username && (
          <p className="text-sm text-muted-foreground mt-1">{user.username}</p>
        )}
        <p className="text-sm text-muted-foreground mt-0.5">{user.phone}</p>
      </div>

      <div className="px-4 space-y-4">
        <SettingsSection>
          <SettingsRow 
            icon={<User className="h-5 w-5" />} 
            label="My Profile" 
            onClick={() => navigate('profile')} 
          />
          <SettingsRow 
            icon={<Users className="h-5 w-5" />} 
            label="Contacts" 
            onClick={() => navigate('contacts')} 
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow 
            icon={<Bell className="h-5 w-5" />} 
            label="Notifications" 
            onClick={() => navigate('notifications')} 
          />
          <SettingsRow 
            icon={<Shield className="h-5 w-5" />} 
            label="Privacy & Security" 
            onClick={() => navigate('privacy')} 
          />
        </SettingsSection>

        <SettingsSection>
          <div className="px-4 py-3 flex flex-col gap-3">
            <div className="flex items-center gap-3 text-muted-foreground mb-1">
              <Palette className="h-5 w-5" />
              <span className="text-[15px] font-medium text-foreground">Theme Settings</span>
            </div>
            <div className="flex p-1 bg-muted rounded-xl gap-1">
              <Button 
                variant={theme === 'light' ? 'default' : 'ghost'} 
                className={`flex-1 h-9 rounded-lg shadow-none ${theme === 'light' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                onClick={() => setTheme('light')}
              >
                <Sun className="h-4 w-4 mr-2" /> Light
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'ghost'} 
                className={`flex-1 h-9 rounded-lg shadow-none ${theme === 'dark' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                onClick={() => setTheme('dark')}
              >
                <Moon className="h-4 w-4 mr-2" /> Dark
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'ghost'} 
                className={`flex-1 h-9 rounded-lg shadow-none ${theme === 'system' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                onClick={() => setTheme('system')}
              >
                <Monitor className="h-4 w-4 mr-2" /> Auto
              </Button>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection>
          <SettingsRow 
            icon={<HelpCircle className="h-5 w-5" />} 
            label="Help" 
            onClick={() => navigate('help')} 
          />
        </SettingsSection>

        <SettingsSection>
          <SettingsRow 
            icon={<LogOut className="h-5 w-5" />} 
            label="Logout" 
            variant="danger"
            onClick={() => navigate('logout')}
          />
        </SettingsSection>
      </div>
      
      <p className="text-center text-xs text-muted-foreground/50 mt-8 mb-4">
        SpotiChat Web 1.0.0
      </p>
    </div>
  );
}
