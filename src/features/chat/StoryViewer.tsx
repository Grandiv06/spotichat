import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Story } from '@/services/chat.service';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onClose, onNext, onPrev }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds per story
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onNext?.();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [story, onNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 space-y-4 bg-gradient-to-b from-black/60 to-transparent">
        {/* Progress Bars */}
        <div className="flex gap-1 h-0.5 w-full">
          <div className="flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-1 ring-white/20">
              <AvatarImage src={story.user.avatar} />
              <AvatarFallback>{story.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-white">
              <p className="text-sm font-medium">{story.user.name}</p>
              <p className="text-[10px] text-white/60">{story.timestamp || 'Just now'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons (Transparent Overlay) */}
      <div className="absolute inset-y-0 left-0 w-1/4 cursor-pointer z-10" onClick={onPrev} />
      <div className="absolute inset-y-0 right-0 w-1/4 cursor-pointer z-10" onClick={onNext} />

      {/* Main Content */}
      <div className="relative w-full max-w-[450px] aspect-[9/16] bg-neutral-900 rounded-lg overflow-hidden shadow-2xl mx-4">
        {story.imageUrl ? (
          <img 
            src={story.imageUrl} 
            alt="Story" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <p>No story image available</p>
          </div>
        )}
        
        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm text-center line-clamp-3">
              {story.caption}
            </p>
          </div>
        )}
      </div>

      {/* Side Navigation Buttons (Desktop Only) */}
      <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-8">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onPrev}
          className="bg-black/20 text-white hover:bg-black/40 h-10 w-10 rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onNext}
          className="bg-black/20 text-white hover:bg-black/40 h-10 w-10 rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};
