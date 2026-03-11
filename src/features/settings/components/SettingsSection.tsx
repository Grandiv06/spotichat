import React from 'react';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function SettingsSection({ title, children, className, description }: SettingsSectionProps) {
  return (
    <div className={cn("flex flex-col mb-4", className)}>
      {title && (
        <h3 className="px-4 text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="bg-card dark:bg-card/50 overflow-hidden sm:rounded-xl border-y sm:border shadow-sm">
        <div className="divide-y divide-border">
          {children}
        </div>
      </div>
      {description && (
        <p className="px-4 mt-2 text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
