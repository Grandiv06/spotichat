import { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { authService } from '@/services/auth.service';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsRow } from '../components/SettingsRow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Copy, Info, Check } from 'lucide-react';

export function ProfileView() {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');

  if (!user) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = async () => {
    try {
      const updated = await authService.updateProfile({ name, username, bio });
      updateProfile(updated);
    } catch (e: any) {
      console.error('Failed to update profile:', e);
    }
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const updated = await authService.uploadAvatar(file);
      updateProfile({ avatar: updated.avatar });
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="animate-in slide-in-from-right-2 duration-300 p-4 space-y-6">
        <div className="flex flex-col items-center mb-6">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-28 w-28 ring-2 ring-border">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              <Camera className="h-8 w-8" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <span
            className="text-sm text-primary mt-2 cursor-pointer hover:underline font-medium"
            onClick={handleAvatarClick}
          >
            {isUploading ? 'Uploading...' : 'Set New Photo'}
          </span>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase ml-1">First Name</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="bg-card/50 h-12"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Username</label>
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="@username"
              className="bg-card/50 h-12"
            />
            <p className="text-xs text-muted-foreground ml-1 mt-1">
              You can choose a username on SpotiChat. If you do, people will be able to find you by this username and contact you without needing your phone number.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase ml-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others a bit about yourself..."
              className="w-full min-h-[100px] resize-none rounded-md border border-input bg-card/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <p className="text-xs text-muted-foreground ml-1 mt-1">
              Any details such as age, occupation or city.
            </p>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full h-12 text-base font-semibold mt-4">
          Save Changes
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-2 duration-300">
      <div className="flex flex-col items-center py-6 bg-card/30">
        <Avatar className="h-32 w-32 ring-4 ring-background shadow-lg mb-4">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-4xl bg-primary/10 text-primary">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-muted-foreground">online</p>
      </div>

      <div className="px-4 py-2">
        <SettingsSection title="Account">
          <SettingsRow 
            label={user.phone} 
            description="Tap to change phone number" 
            rightElement={
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(user.phone, 'phone'); }}>
                {copiedId === 'phone' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
              </Button>
            }
          />
          <SettingsRow 
            label={user.username || 'None'} 
            description="Username" 
            rightElement={
              user.username ? (
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(user.username!, 'username'); }}>
                  {copiedId === 'username' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </Button>
              ) : null
            }
          />
          <SettingsRow 
            label={user.bio || 'Bio'} 
            description={user.bio ? 'Bio' : 'Add a few words about yourself'} 
            icon={<Info className="h-4 w-4" />}
          />
        </SettingsSection>
        
        <div className="mt-6 flex justify-center">
           <Button onClick={() => setIsEditing(true)} className="w-[80%]" variant="outline">
              Edit Profile
           </Button>
        </div>
      </div>
    </div>
  );
}
