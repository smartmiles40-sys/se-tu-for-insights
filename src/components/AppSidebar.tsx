import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import logoStfev from '@/assets/logo-stfev.png';
import {
  LayoutDashboard,
  Upload,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  FileSpreadsheet,
  Target,
  Settings,
} from 'lucide-react';
import { useStagingPendingCount } from '@/hooks/useStagingNegocios';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
];

const dataItems = [
  { path: '/metas', label: 'Metas', icon: Target, roles: ['admin', 'gestor'] },
  { path: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['admin', 'gestor'] },
  { path: '/staging', label: 'Dados Recebidos', icon: FileSpreadsheet, roles: ['admin', 'gestor'], showBadge: true },
  { path: '/import', label: 'Importar Dados', icon: Upload, roles: ['admin', 'gestor'] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const { data: pendingCount } = useStagingPendingCount();

  const filteredDataItems = dataItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role || '');
  });

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-3 font-display font-bold text-sidebar-foreground">STFEV</span>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0',
          collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <img 
              src={logoStfev} 
              alt="Se Tu For, Eu Vou!" 
              className="h-14 w-auto brightness-0 invert"
            />
          )}
          {collapsed && (
            <img 
              src={logoStfev} 
              alt="STFEV" 
              className="h-8 w-auto brightness-0 invert mx-auto"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <ThemeToggle collapsed={collapsed} />
          
          {/* Data Items - Below Theme Toggle */}
          {filteredDataItems.map((item) => {
            const isActive = location.pathname === item.path;
            const showBadge = 'showBadge' in item && item.showBadge && pendingCount && pendingCount > 0;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium flex-1">{item.label}</span>
                )}
                {showBadge && (
                  <Badge 
                    variant="destructive" 
                    className={cn(
                      "h-5 min-w-[20px] px-1.5 text-xs",
                      collapsed && "absolute -top-1 -right-1"
                    )}
                  >
                    {pendingCount}
                  </Badge>
                )}
              </NavLink>
            );
          })}

          {!collapsed && user && (
            <div className="mb-3 px-3">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {role || 'Carregando...'}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={signOut}
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive',
              !collapsed && 'w-full justify-start'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  );
}
