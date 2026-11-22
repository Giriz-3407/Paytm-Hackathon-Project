'use client';

import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Activity,
  LayoutDashboard,
  Map,
  Layers3,
  History,
  Database,
  Settings,
  CircleHelp,
  ChevronDown,
  Shield,
  Check,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import { dataMode } from '@/services/repositories';

export const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, group: 'workspace' },
  { href: '/map', label: 'Crisis Map', icon: Map, group: 'workspace' },
  { href: '/incidents', label: 'Incidents', icon: Layers3, group: 'workspace' },
  { href: '/replay', label: 'Historical Replay', icon: History, group: 'workspace' },
  { href: '/sources', label: 'Data Sources', icon: Database, group: 'manage' },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'manage' },
  { href: '/help', label: 'Help & About', icon: CircleHelp, group: 'manage' },
] as const;

export function isActiveRoute(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function SidebarContent({
  path,
  compact,
  incidentCount,
  onNavigate,
}: {
  path: string;
  compact: boolean;
  incidentCount: number;
  onNavigate: () => void;
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="brand"
        aria-label="Crisis Lens overview"
        onClick={onNavigate}
      >
        <span className="brand-mark">
          <Activity size={23} strokeWidth={2.2} />
        </span>
        <span className="brand-name">
          crisis<span>lens</span>
          <small>CRISIS INTELLIGENCE</small>
        </span>
      </Link>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="workspace-switch" aria-label="Workspace menu">
            <span className="workspace-avatar">IN</span>
            <span>
              India workspace<small>Personal workspace</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="workspace-menu"
            data-navigation-control
            sideOffset={8}
            align="start"
          >
            <DropdownMenu.Label>
              India workspace <Check size={12} />
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            {[
              { href: '/settings', label: 'Workspace preferences' },
              { href: '/replay', label: 'Historical training scenarios' },
              { href: '/help', label: 'About this workspace' },
            ].map((item) => (
              <DropdownMenu.Item asChild key={item.href} onSelect={onNavigate}>
                <Link href={item.href}>{item.label}</Link>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <nav aria-label="Main navigation">
        {(['workspace', 'manage'] as const).map((group) => (
          <div className="navigation-group" key={group}>
            <p className="nav-label">{group === 'workspace' ? 'WORKSPACE' : 'MANAGE'}</p>
            {navigation
              .filter((item) => item.group === group)
              .map((item) => {
                const link = (
                  <Link
                    className={cn('nav-item', isActiveRoute(path, item.href) && 'active')}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={isActiveRoute(path, item.href) ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                    {item.href === '/incidents' && (
                      <span className="nav-count" aria-hidden="true">
                        {incidentCount}
                      </span>
                    )}
                  </Link>
                );
                return compact ? (
                  <Tooltip key={item.href} label={item.label}>
                    {link}
                  </Tooltip>
                ) : (
                  <span className="nav-link-wrapper" key={item.href}>
                    {link}
                  </span>
                );
              })}
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot" />
          <span>
            {dataMode === 'mock' ? 'Demo workspace' : 'API workspace'}
            <small>{dataMode === 'mock' ? 'Illustrative data only' : 'Backend configured'}</small>
          </span>
          <Shield size={15} />
        </div>
        <Link
          className="profile"
          href="/settings"
          aria-label="Personal preferences"
          onClick={onNavigate}
        >
          <span className="avatar">AK</span>
          <span>
            Analyst workspace<small>Personal preferences</small>
          </span>
          <Settings size={15} />
        </Link>
      </div>
    </>
  );
}
