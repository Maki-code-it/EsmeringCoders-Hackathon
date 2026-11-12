import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/components/utils.js';
import { Button } from '@/components/ui/button.jsx';

/**
 * Single shared shell: sidebar + topbar.
 * @param {{ id: string, label: string, icon: Component }[]} navItems
 */
export default function AppLayout({ navItems, activeId, onNavigate, topbarRight, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen md:flex">
      {menuOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/30 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-sidebar p-4 transition-transform md:static md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <div>
            <p className="text-xl font-bold text-primary">SahodSuri</p>
            <p className="text-xs text-muted-foreground">Understand Your Pay. Know Your Rights.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={id === activeId ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                id === activeId
                  ? 'bg-primary text-primary-foreground'
                  : 'text-secondary-foreground hover:bg-accent',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b bg-card px-4 md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto">{topbarRight}</div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
