import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0">
        {/* Header */}
        <header className="h-20 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="h-full px-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
