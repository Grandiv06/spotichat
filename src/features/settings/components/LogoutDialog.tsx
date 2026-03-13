import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '../store/settings.store';
import { authService } from '@/services/auth.service';

export function LogoutDialog() {
  const { logout } = useAuthStore();
  const { activeView, goBack, setOpen } = useSettingsStore();

  const isLogoutOpen = activeView === 'logout';

  const handleLogout = async () => {
    await authService.logout();
    logout();
    setOpen(false);
  };

  return (
    <Dialog open={isLogoutOpen} onOpenChange={(open) => !open && goBack()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign Out</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out of SpotiChat? You will need to sign in again to receive new messages.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end flex-row space-x-2 mt-4">
          <Button variant="outline" onClick={goBack} className="flex-1">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="flex-1">
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
