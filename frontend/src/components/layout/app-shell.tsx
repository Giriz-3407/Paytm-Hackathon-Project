'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Activity,
  LayoutDashboard,
  Map,
  Layers3,
  History,
  Database,
  Settings,
  CircleHelp,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  Command,
  Shield,
  ArrowUpRight,
} from 'lucide-react';
import { Button, Dialog, Input } from '@/components/ui/primitives';
import { useUI } from '@/stores/ui-store';
import { useIncidents } from '@/services/hooks';
import { cn } from '@/lib/utils';
import { dataMode } from '@/services/repositories';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/map', label: 'Crisis Map', icon: Map },
  { href: '/incidents', label: 'Incidents', icon: Layers3 },
  { href: '/replay', label: 'Historical Replay', icon: History },
  { href: '/sources', label: 'Data Sources', icon: Database },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & About', icon: CircleHelp },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { collapsed, theme, set } = useUI();
  const [mobile, setMobile] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState(false);
  const [ack, setAck] = useState(false);
  const { data = [] } = useIncidents();
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const active = nav.find((n) => path.startsWith(n.href));
  const sidebar = (
    <>
      <Link
        href="/dashboard"
        className="brand"
        aria-label="Crisis Lens overview"
        onClick={() => {
          setMobile(false);
          set({ collapsed: true });
        }}
      >
        <span className="brand-mark">
          <Activity size={23} strokeWidth={2.2} />
        </span>
        <span className="brand-name">
          crisis<span>lens</span>
          <small>INTELLIGENCE PLATFORM</small>
        </span>
      </Link>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="workspace-switch" aria-label="Workspace menu">
            <span className="workspace-avatar">IN</span>
            <span>
              India workspace<small>Analyst workspace</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="workspace-menu" sideOffset={6} align="start">
            <DropdownMenu.Label>India workspace · Demo</DropdownMenu.Label>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onSelect={() => {
                router.push('/settings');
                setMobile(false);
              }}
            >
              Workspace preferences
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                router.push('/replay');
                setMobile(false);
              }}
            >
              Historical training scenarios
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={() => {
                router.push('/help');
                setMobile(false);
              }}
            >
              About this workspace
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        {nav.map((n) => (
          <div key={n.href}>
            {n.href === '/sources' && <div className="nav-label nav-secondary">MANAGE</div>}
            <Link
              title={collapsed ? n.label : undefined}
              className={cn('nav-item', path.startsWith(n.href) && 'active')}
              href={n.href}
              onClick={() => {
                setMobile(false);
                if (n.href === '/dashboard') set({ collapsed: true });
              }}
              aria-current={path.startsWith(n.href) ? 'page' : undefined}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.href === '/incidents' && <span className="nav-count">{data.length}</span>}
            </Link>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot" />
          <span>
            {dataMode === 'mock' ? 'Demo environment' : 'API environment'}
            <small>{dataMode === 'mock' ? 'Illustrative data only' : 'Backend configured'}</small>
          </span>
          <Shield size={16} />
        </div>
        <button
          className="profile"
          onClick={() => {
            router.push('/settings');
            setMobile(false);
          }}
        >
          <span className="avatar">AK</span>
          <span>
            Analyst workspace<small>Personal preferences</small>
          </span>
          <ChevronDown size={14} />
        </button>
      </div>
    </>
  );
  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside
        id="workspace-sidebar"
        className="sidebar"
        onClickCapture={() => {
          if (collapsed) set({ collapsed: false });
        }}
      >
        {sidebar}
        <button
          className="collapse-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          aria-controls="workspace-sidebar"
          onClick={() => set({ collapsed: !collapsed })}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </aside>
      <Dialog open={mobile} onOpenChange={setMobile} title="Navigation" drawer>
        <div className="mobile-sidebar">{sidebar}</div>
      </Dialog>
      <div className="app-body">
        <header className="topbar">
          <div className="topbar-left">
            <Button
              className="desktop-sidebar-toggle"
              size="icon"
              variant="ghost"
              aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'}
              aria-expanded={!collapsed}
              aria-controls="workspace-sidebar"
              onClick={() => set({ collapsed: !collapsed })}
            >
              <Menu size={20} />
            </Button>
            <Button
              className="mobile-menu"
              size="icon"
              variant="ghost"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{active?.label || 'Incident details'}</strong>
            </span>
          </div>
          <div className="topbar-right">
            <button className="global-search" onClick={() => setSearchOpen(true)}>
              <Search size={15} />
              <span>Search anything...</span>
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
            <span className="avatar topbar-avatar">AK</span>
          </div>
        </header>
        <main
          id="main-content"
          onClickCapture={() => {
            if (!collapsed && window.matchMedia('(min-width: 768px)').matches)
              set({ collapsed: true });
          }}
        >
          {children}
        </main>
        <footer className="app-footer">
          <span>
            <Shield size={12} /> Situational awareness. Follow official emergency guidance.
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
          placeholder="Search incidents or locations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="search-results">
          {data
            .filter((i) =>
              `${i.title} ${i.location.city} ${i.id}`.toLowerCase().includes(search.toLowerCase()),
            )
            .slice(0, 8)
            .map((i) => (
              <Link key={i.id} onClick={() => setSearchOpen(false)} href={`/incidents/${i.id}`}>
                <Search size={15} />
                <span>
                  {i.title}
                  <small>
                    {i.id} · {i.location.city}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </Link>
            ))}
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
