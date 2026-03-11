import { Outlet } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-background items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center select-none">
          <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <MessageCircle size={36} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SpotiChat</h1>
          <p className="text-muted-foreground mt-1 text-sm">A modern messaging experience</p>
        </div>
        
        <div className="w-full bg-card rounded-2xl border shadow-sm p-6 sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
