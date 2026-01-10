import { ReactNode, useState, useCallback, useEffect } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Listen for fullscreen changes (e.g., user presses Esc or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  return (
    <div className={cn(
      "min-h-screen flex w-full bg-background",
      isFullscreen && "tv-mode"
    )}>
      {/* Hide sidebar in fullscreen mode */}
      {!isFullscreen && <AppSidebar />}
      
      <main className={cn(
        "flex-1 relative transition-all duration-300",
        !isFullscreen && "lg:ml-0 mt-14 lg:mt-0"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className={cn(
            "fixed z-50 bg-background/80 backdrop-blur-sm hover:bg-background transition-all",
            isFullscreen 
              ? "top-2 right-2 opacity-30 hover:opacity-100" 
              : "top-2 right-2 lg:top-4 lg:right-4"
          )}
          title={isFullscreen ? 'Sair do fullscreen (ESC ou F11)' : 'Tela cheia (F11)'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
        <div className={cn(
          "transition-all duration-300",
          isFullscreen 
            ? "p-2 lg:p-3 2xl:p-4 tv-content" 
            : "p-4 lg:p-6"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
