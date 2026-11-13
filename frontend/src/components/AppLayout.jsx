import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/components/utils.js';
import { Button } from '@/components/ui/button.jsx';

function Wordmark({ className }) {
  return (
    <span className={cn('font-bold tracking-tight', className)}>
      Earn<span className="text-primary">est</span>
    </span>
  );
}

/**
 * Single shared shell: floating glass sidebar + floating glass top bar.
 * Page content scrolls underneath the top bar, so the glass blur is visible.
 * @param {{ id: string, label: string, icon: Component }[]} navItems
 */
export default function AppLayout({ navItems, activeId, onNavigate, topbarRight, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel = navItems.find((item) => item.id === activeId)?.label;

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (id) => {
    onNavigate(id);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-dvh md:flex">
      {menuOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-[2px] md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'glass glass-panel fixed bottom-3 left-3 top-3 z-30 flex w-64 flex-col rounded-[1.75rem] p-4 transition-transform duration-300 ease-out',
          'md:sticky md:bottom-auto md:m-3 md:mr-0 md:h-[calc(100dvh-1.5rem)] md:shrink-0 md:self-start md:translate-x-0',
          menuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1.5rem)]',
        )}
      >
        <div className="mb-7 flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-3">
            <span className="brand-mark" aria-hidden="true">
              ₱
            </span>
            <div>
              <Wordmark className="block text-lg leading-tight" />
              <p className="text-xs leading-snug text-muted-foreground">Understand Your Pay. Know Your Rights.</p>
            </div>
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

        <nav className="flex flex-col gap-1.5" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={id === activeId ? 'page' : undefined}
              className="nav-glass flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[0.95rem] font-medium"
            >
              <Icon className="h-[1.1rem] w-[1.1rem] shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass glass-panel sticky top-3 z-10 mx-3 mt-3 flex h-14 items-center gap-2 rounded-full px-2.5 md:mx-6 md:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Wordmark className="md:hidden" />
          {activeLabel && (
            <p className="hidden text-sm text-muted-foreground md:block">
              Earnest <span aria-hidden="true">/</span>{' '}
              <span className="font-medium text-foreground">{activeLabel}</span>
            </p>
          )}
          <div className="ml-auto">{topbarRight}</div>
        </header>
        <main className="flex-1 px-4 pb-10 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
