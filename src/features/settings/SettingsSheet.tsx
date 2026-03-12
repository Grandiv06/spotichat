import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useSettingsStore } from './store/settings.store';
import { MainMenuView } from './views/MainMenuView';
import { ProfileView } from './views/ProfileView';
import { ContactsView } from './views/ContactsView';
import { NotificationsView } from './views/NotificationsView';
import { PrivacyView } from './views/PrivacyView';
import { PrivacyDetailView } from './views/PrivacyDetailView';
import { DevicesView } from './views/DevicesView';
import { StorageView } from './views/StorageView';
import { HelpView } from './views/HelpView';
import { LogoutDialog } from './components/LogoutDialog';

export function SettingsSheet() {
  const { isOpen, setOpen, activeView, goBack, viewHistory } = useSettingsStore();

  const renderView = () => {
    switch (activeView) {
      case 'main':
        return <MainMenuView />;
      case 'profile':
        return <ProfileView />;
      case 'contacts':
        return <ContactsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'privacy':
        return <PrivacyView />;
      case 'privacy-phone-number':
        return (
          <PrivacyDetailView
            field="phoneNumber"
            title="Phone Number"
            description="Choose who can see your phone number, similar to Telegram."
          />
        );
      case 'privacy-last-seen':
        return (
          <PrivacyDetailView
            field="lastSeen"
            title="Last Seen & Online"
            description="Decide who can see your last seen and online status."
          />
        );
      case 'privacy-profile-photo':
        return (
          <PrivacyDetailView
            field="profilePhoto"
            title="Profile Photo"
            description="Control who is allowed to see your profile photo."
          />
        );
      case 'devices':
        return <DevicesView />;
      case 'storage':
        return <StorageView />;
      case 'help':
        return <HelpView />;
      default:
        return <MainMenuView />;
    }
  };

  const getTitle = () => {
    switch (activeView) {
      case 'main':
        return 'Settings';
      case 'profile':
        return 'My Profile';
      case 'contacts':
        return 'Contacts';
      case 'notifications':
        return 'Notifications';
      case 'privacy':
        return 'Privacy & Security';
      case 'privacy-phone-number':
        return 'Phone Number';
      case 'privacy-last-seen':
        return 'Last Seen & Online';
      case 'privacy-profile-photo':
        return 'Profile Photo';
      case 'devices':
        return 'Devices';
      case 'storage':
        return 'Storage & Data';
      case 'help':
        return 'Help';
      default:
        return 'Settings';
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-full !max-w-full sm:!max-w-[400px] p-0 flex flex-col h-[100dvh] bg-background border-r border-none sm:border-solid"
        >
          
          {/* Custom Header for Back Navigation */}
          <div className="flex items-center px-4 py-3 border-b bg-card/50 min-h-[64px]">
            {viewHistory.length > 0 && (
              <Button variant="ghost" size="icon" onClick={goBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-lg font-semibold flex-1">{getTitle()}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="ml-1"
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto w-full h-full pb-6">
            {renderView()}
          </div>
        </SheetContent>
      </Sheet>

      <LogoutDialog />
    </>
  );
}
