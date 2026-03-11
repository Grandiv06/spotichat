import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'danger';
}

export function SettingsRow({
  icon,
  label,
  description,
  rightElement,
  onClick,
  className,
  variant = 'default'
}: SettingsRowProps) {
  const isClickable = !!onClick;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-between px-4 py-3 min-h-[56px] transition-colors",
        isClickable ? "cursor-pointer hover:bg-accent/50 active:bg-accent" : "",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 flex-1 overflow-hidden">
        {icon && (
          <div className={cn(
            "flex-shrink-0 text-muted-foreground",
            variant === 'danger' && "text-destructive"
          )}>
            {icon}
          </div>
        )}
        <div className="flex flex-col flex-1 truncate">
          <span className={cn(
            "text-base font-medium truncate",
            variant === 'danger' && "text-destructive"
          )}>
            {label}
          </span>
          {description && (
            <span className="text-sm text-muted-foreground truncate">
              {description}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center ml-4 pl-2 flex-shrink-0">
        {rightElement ? rightElement : (
          isClickable && <ChevronRight className="h-5 w-5 text-muted-foreground opacity-50" />
        )}
      </div>
    </div>
  );
}
