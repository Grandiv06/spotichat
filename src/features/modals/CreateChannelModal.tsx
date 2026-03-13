import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useModalStore } from "@/store/modal.store";
import { Camera, Globe, Lock } from "lucide-react";
import { channelService } from "@/services/channel.service";
import type { ChannelVisibility } from "@/services/channel.service";

export function CreateChannelModal() {
  const { isCreateChannelOpen, setCreateChannelOpen } = useModalStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Step 1
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");
  
  // Step 2
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced username availability check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    const handle = setTimeout(async () => {
      try {
        const res = await channelService.checkUsernameAvailable(username.trim());
        setUsernameStatus(res.available ? "available" : "taken");
      } catch {
        setUsernameStatus("error");
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [username]);

  const handleCreate = async () => {
    if (!channelName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const visibility: ChannelVisibility = isPrivate ? "private" : "public";
      await channelService.createChannel({
        name: channelName.trim(),
        description: description.trim() || undefined,
        visibility,
        username: username.trim() || undefined,
        initialSubscriberIds: [], // TODO: map from selectedContacts to real userIds
      });
      // Reset and close
      setChannelName("");
      setDescription("");
      setUsername("");
      setUsernameStatus("idle");
      setIsPrivate(false);
      setStep(1);
      setCreateChannelOpen(false);
    } catch (e) {
      console.error("Failed to create channel", e);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStep(1);
      setChannelName('');
      setDescription('');
      setUsername('');
      setUsernameStatus("idle");
      setIsPrivate(false);
      setSelectedContacts([]);
    }
    setCreateChannelOpen(open);
  };

  const getTitle = () => {
    if (step === 1) return "New Channel";
    if (step === 2) return "Channel Type";
    return "Confirm";
  };

  return (
    <Dialog open={isCreateChannelOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b bg-muted/20">
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px] p-6 space-y-6">
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 cursor-pointer hover:bg-primary/20 transition-colors border border-primary/20">
                <Camera className="h-8 w-8 text-primary/70" />
              </div>
              <Label htmlFor="channelName" className="sr-only">Channel Name</Label>
              <Input 
                id="channelName"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel Name" 
                className="text-center text-lg font-medium border-x-0 border-t-0 rounded-none border-b-2 border-muted focus-visible:border-primary focus-visible:ring-0 px-0 h-10 bg-transparent w-full shadow-none mb-4"
                autoFocus
              />
              <Label htmlFor="channelDesc" className="sr-only">Description</Label>
              <Input 
                id="channelDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)" 
                className="text-center text-sm border-x-0 border-t-0 rounded-none border-b border-muted focus-visible:border-primary focus-visible:ring-0 px-0 h-8 bg-transparent w-full shadow-none"
              />
            </div>

            {/* Public username (Telegram-style) */}
            <div className="space-y-2">
              <Label htmlFor="channelUsername" className="text-xs text-muted-foreground">
                Public link (optional)
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground select-none">
                  t.me/
                </span>
                <Input
                  id="channelUsername"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setUsernameStatus("idle");
                  }}
                  placeholder="channel_username"
                  className="h-9 text-sm"
                />
              </div>
              {username && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  {usernameStatus === "checking" && "Checking availability..."}
                  {usernameStatus === "available" && "This link is available."}
                  {usernameStatus === "taken" && "This link is already taken."}
                  {usernameStatus === "error" && "Could not check username right now."}
                </p>
              )}
            </div>
            
            <div className="flex-1" />
            
            <div className="flex justify-end w-full">
               <Button 
                onClick={() => setStep(2)} 
                disabled={!channelName.trim()}
                className="rounded-full px-6"
               >
                 Next
               </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px]">
            <div className="flex flex-col space-y-4 p-4">
              <div 
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border ${!isPrivate ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => setIsPrivate(false)}
              >
                <Globe className={`h-6 w-6 mt-0.5 ${!isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[15px]">Public Channel</span>
                  <span className="text-sm text-muted-foreground leading-snug">Public channels can be found in search, anyone can join them.</span>
                </div>
              </div>

              <div 
                className={`flex items-start gap-4 p-4 rounded-xl cursor-pointer border ${isPrivate ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50'}`}
                onClick={() => setIsPrivate(true)}
              >
                <Lock className={`h-6 w-6 mt-0.5 ${isPrivate ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-[15px]">Private Channel</span>
                  <span className="text-sm text-muted-foreground leading-snug">Private channels can only be joined via invite link.</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1" />
            
            <div className="p-4 border-t bg-muted/10 flex justify-between items-center w-full">
              <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Back</Button>
              <Button onClick={() => setStep(3)} className="rounded-full px-6">Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col h-[50dvh] sm:h-[400px]">
            <div className="p-5 space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Create channel</p>
              <div className="space-y-1 text-xs sm:text-sm">
                <div>
                  <span className="font-semibold text-foreground">Name: </span>
                  <span>{channelName || "-"}</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">Type: </span>
                  <span>{isPrivate ? "Private channel" : "Public channel"}</span>
                </div>
                {username && (
                  <div>
                    <span className="font-semibold text-foreground">Link: </span>
                    <span>t.me/{username}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] sm:text-xs">
                You can add subscribers and admins later from the channel info screen. For now
                the channel will be created and only you will be inside it.
              </p>
            </div>

            <div className="flex-1" />

            <div className="p-4 border-t bg-muted/10 flex justify-between items-center w-full">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="rounded-full"
              >
                Back
              </Button>
              <Button
                onClick={handleCreate}
                className="rounded-full px-6"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
