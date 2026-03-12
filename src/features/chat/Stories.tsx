import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { chatService } from '@/services/chat.service';
import type { Story } from '@/services/chat.service';
import { cn } from '@/lib/utils';
import { StoryViewer } from './StoryViewer';

export const Stories: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      const data = await chatService.getStories();
      setStories(data);
    };
    fetchStories();
  }, []);

  const handleNext = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex < stories.length - 1) {
      setSelectedStory(stories[currentIndex + 1]);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrev = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex > 0) {
      setSelectedStory(stories[currentIndex - 1]);
    }
  };

  return (
    <>
      <div className="relative">
        <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto no-scrollbar">
        {/* Your Story Button */}
        <div className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
          <div className="relative mb-1">
            <Avatar className="h-14 w-14 border-2 border-transparent transition-all group-active:scale-95">
              <AvatarImage src="https://i.pravatar.cc/150?u=me" />
              <AvatarFallback>Me</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-0.5 border-2 border-background shadow-sm">
              <Plus className="h-3 w-3" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Your Story</span>
        </div>

        {/* User Stories */}
        {stories.map((story) => (
          <div 
            key={story.id} 
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            onClick={() => setSelectedStory(story)}
          >
            <div className={cn(
              "relative mb-1 p-[2.5px] rounded-full transition-all group-active:scale-95",
              story.hasUnseen 
                ? "bg-gradient-to-tr from-primary via-primary/80 to-primary/40" 
                : "border-[1px] border-muted-foreground/30"
            )}>
              <div className="bg-background rounded-full p-[2px]">
                <Avatar className="h-14 w-14 border-0">
                  <AvatarImage src={story.user.avatar} />
                  <AvatarFallback>{story.user.name[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className={cn(
              "text-[11px] font-medium transition-colors truncate max-w-[60px]",
              story.hasUnseen ? "text-foreground" : "text-muted-foreground group-hover:text-primary"
            )}>
              {story.user.name}
            </span>
          </div>
        ))}
        </div>

        {/* Right edge gradient to softly fade half-visible stories */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-sidebar to-transparent" />
      </div>

      {selectedStory && (
        <StoryViewer 
          story={selectedStory} 
          onClose={() => setSelectedStory(null)} 
          onNext={handleNext}
          onPrev={handlePrev}
        />
      )}
    </>
  );
};
