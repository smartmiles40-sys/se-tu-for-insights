import { ReactNode, useState, useCallback } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes (e.g., user presses Esc)
  document.addEventListener('fullscreenchange', () => {
    setIsFullscreen(!!document.fullscreenElement);
  });

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="fixed top-2 right-2 lg:top-4 lg:right-4 z-50 bg-background/80 backdrop-blur-sm hover:bg-background"
          title={isFullscreen ? 'Sair do fullscreen' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
