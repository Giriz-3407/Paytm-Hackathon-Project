'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Command,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { Button, Dialog, Input } from '@/components/ui/primitives';
import { SidebarContent, navigation, isActiveRoute } from './sidebar';
import { useUI } from '@/stores/ui-store';
import { useIncidents } from '@/services/hooks';
import { cn } from '@/lib/utils';
import { dataMode } from '@/services/repositories';

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { collapsed, theme, set } = useUI();
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [ack, setAck] = useState(false);
  const { data = [] } = useIncidents();
  const closeNavigation = () => {
    setMobile(false);
    set({ collapsed: true });
  };

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
      if (event.key === 'Escape' && !event.defaultPrevented && !useUI.getState().collapsed) {
        useUI.getState().set({ collapsed: true });
        toggleRef.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Element &&
        !window.matchMedia('(max-width: 767px)').matches &&
        !sidebarRef.current?.contains(target) &&
        !target.closest('[data-navigation-control]') &&
        !useUI.getState().collapsed
      ) {
        useUI.getState().set({ collapsed: true });
      }
    };
    const viewport = window.matchMedia('(max-width: 767px)');
    const resize = () => {
      setMobile(false);
      if (viewport.matches) useUI.getState().set({ collapsed: true });
    };
    window.addEventListener('keydown', key);
    document.addEventListener('pointerdown', outside, true);
    viewport.addEventListener('change', resize);
    return () => {
      window.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', outside, true);
      viewport.removeEventListener('change', resize);
    };
  }, []);

  const active = navigation.find((item) => isActiveRoute(path, item.href));
  const incidentId = path.startsWith('/incidents/')
    ? decodeURIComponent(path.split('/').at(-1) || '')
    : null;
  const results = data
    .filter((incident) =>
      `${incident.title} ${incident.location.city} ${incident.location.state} ${incident.id}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .slice(0, 8);

  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        ref={sidebarRef}
        id="workspace-sidebar"
        className="sidebar"
        data-expanded={!collapsed}
        aria-label="Workspace sidebar"
        onPointerDown={(event) => {
          if (collapsed && event.target === event.currentTarget) set({ collapsed: false });
        }}
      >
        <SidebarContent
          path={path}
          compact={collapsed}
          incidentCount={data.length}
          onNavigate={closeNavigation}
        />
        <button
          className="collapse-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="workspace-sidebar"
          onClick={() => set({ collapsed: !collapsed })}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span>Collapse navigation</span>
        </button>
      </aside>
      <Dialog
        open={mobile}
        onOpenChange={setMobile}
        title="Navigation"
        description="Choose a page in your Crisis Lens workspace."
        drawer
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          mobileToggleRef.current?.focus();
        }}
      >
        <div className="mobile-sidebar">
          <SidebarContent
            path={path}
            compact={false}
            incidentCount={data.length}
            onNavigate={closeNavigation}
          />
        </div>
      </Dialog>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              ref={toggleRef}
              className="desktop-sidebar-toggle"
              size="icon"
              variant="ghost"
              data-navigation-control
              aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
              aria-expanded={!collapsed}
              aria-controls="workspace-sidebar"
              onClick={() => set({ collapsed: !collapsed })}
            >
              <Menu size={20} />
            </Button>
            <Button
              className="mobile-menu"
              ref={mobileToggleRef}
              size="icon"
              variant="ghost"
              aria-label="Open navigation"
              aria-expanded={mobile}
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </Button>
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link className="breadcrumb-parent" href="/dashboard" onClick={closeNavigation}>
                Workspace
              </Link>
              <span className="breadcrumb-parent" aria-hidden="true">
                /
              </span>
              {incidentId ? (
                <>
                  <Link href="/incidents" onClick={closeNavigation}>
                    Incidents
                  </Link>
                  <span aria-hidden="true">/</span>
                  <strong aria-current="page">{incidentId}</strong>
                </>
              ) : (
                <strong aria-current="page">{active?.label || 'Page not found'}</strong>
              )}
            </nav>
          </div>
          <div className="topbar-right">
            <button
              className="global-search"
              aria-label="Search workspace"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={15} />
              <span>Search workspace...</span>
              <kbd>
                <Command size={10} /> K
              </kbd>
            </button>
            <span className="topbar-divider" />
            <Button
              size="icon"
              variant="ghost"
              aria-label="Toggle theme"
              onClick={() => set({ theme: theme === 'dark' ? 'light' : 'dark' })}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button
              className="notification-button"
              size="icon"
              variant="ghost"
              aria-label="Notifications"
              onClick={() => setNotifications(true)}
            >
              <Bell size={18} />
              {!ack && <i />}
            </Button>
            <Link
              href="/settings"
              className="avatar topbar-avatar"
              aria-label="Open personal preferences"
            >
              AK
            </Link>
          </div>
        </header>
        <main id="main-content">
          <div className="route-view" key={path}>
            {children}
          </div>
        </main>
        <footer className="app-footer">
          <span>
            <Shield size={12} />
            Situational awareness. Follow official emergency guidance.
          </span>
          <span>
            Crisis Lens <span className="footer-version">v1.0</span> ·{' '}
            {dataMode === 'mock' ? 'Demo workspace' : 'API workspace'}
          </span>
        </footer>
      </div>
      <Dialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search workspace"
        description="Find incidents by title, location, or ID."
      >
        <Input
          autoFocus
          aria-label="Search workspace incidents"
          placeholder="Search incidents or locations..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="search-results">
          {results.length ? (
            results.map((incident) => (
              <Link
                key={incident.id}
                onClick={() => setSearchOpen(false)}
                href={`/incidents/${incident.id}`}
              >
                <Search size={15} />
                <span>
                  {incident.title}
                  <small>
                    {incident.id} · {incident.location.city}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </Link>
            ))
          ) : (
            <div className="search-results-empty">
              No matching incidents. Try another location or keyword.
            </div>
          )}
        </div>
      </Dialog>
      <Dialog
        open={notifications}
        onOpenChange={setNotifications}
        title="Notifications"
        description="Local demo notifications. No external alert service is connected."
      >
        {ack ? (
          <p className="muted">You’re all caught up.</p>
        ) : (
          <>
            <div className="notice">
              <Bell size={20} />
              <div>
                <strong>Demo workspace ready</strong>
                <p>
                  Explore {data.length} illustrative incidents and two historical training
                  scenarios.
                </p>
              </div>
            </div>
            <Button onClick={() => setAck(true)}>Mark as read</Button>
          </>
        )}
      </Dialog>
    </div>
  );
}
