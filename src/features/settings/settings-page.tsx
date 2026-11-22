'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sun, Moon, Monitor, Save, Shield, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useUI } from '@/stores/ui-store';
import { dateLabel } from '@/lib/utils';
import { PageHeader } from '@/components/shared/page-header';
import {
  Button,
  Card,
  Input,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
} from '@/components/ui/primitives';
import { categories, severities } from '@/types/domain';
const schema = z.object({
  timezone: z.enum(['Asia/Kolkata', 'UTC', 'Europe/London', 'America/New_York']),
  defaultView: z.enum(['/dashboard', '/monitoring', '/map', '/replay']),
  dateFormat: z.enum(['dd MMM yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']),
});
type GeneralValues = z.infer<typeof schema>;
export function SettingsPage() {
  const prefs = useUI();
  const [confirm, setConfirm] = useState(false);
  const form = useForm<GeneralValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      timezone: prefs.timezone as GeneralValues['timezone'],
      defaultView: prefs.defaultView as GeneralValues['defaultView'],
      dateFormat: prefs.dateFormat as GeneralValues['dateFormat'],
    },
  });
  const save = (v: GeneralValues) => {
    prefs.set(v);
    toast.success('Preferences saved on this device');
  };
  return (
    <div className="page-content">
      <PageHeader
        title="Settings"
        description="Make Crisis Lens work the way you do. Preferences are saved on this device."
      />
      <Tabs defaultValue="general">
        <TabsList>
          {[
            'General',
            'Appearance',
            'Monitoring Preferences',
            'Notifications',
            'Data & Privacy',
            'About',
          ].map((t) => (
            <TabsTrigger value={t.toLowerCase()} key={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="general">
          <Card className="settings-card">
            <h2>General preferences</h2>
            <p>Your preferred starting view, timezone, and date format.</p>
            <form onSubmit={form.handleSubmit(save)} className="settings-form">
              <label>
                Default dashboard view
                <select className="input select" {...form.register('defaultView')}>
                  <option value="/dashboard">Overview</option>
                  <option value="/monitoring">Live Monitoring</option>
                  <option value="/map">Crisis Map</option>
                  <option value="/replay">Historical Replay</option>
                </select>
              </label>
              <label>
                Timezone
                <select className="input select" {...form.register('timezone')}>
                  <option value="Asia/Kolkata">India Standard Time · Asia/Kolkata</option>
                  <option value="UTC">Coordinated Universal Time · UTC</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
              </label>
              <label>
                Date format
                <select className="input select" {...form.register('dateFormat')}>
                  <option>dd MMM yyyy</option>
                  <option>yyyy-MM-dd</option>
                  <option>MM/dd/yyyy</option>
                </select>
              </label>
              {Object.values(form.formState.errors).map((e) => (
                <p role="alert" key={e.message}>
                  {e.message}
                </p>
              ))}
              <p className="muted">
                Incident, evidence, source, and report dates use these display preferences. The
                replay clock stays explicitly in IST so its historical context remains clear.
              </p>
              <div className="notice">
                <Info size={15} />
                <p>
                  Preview:{' '}
                  {dateLabel('2026-11-22T06:30:00Z', true, prefs.timezone, prefs.dateFormat)}
                </p>
              </div>
              <Button variant="default" type="submit">
                <Save size={15} />
                Save preferences
              </Button>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card className="settings-card">
            <h2>Appearance</h2>
            <p>Choose a comfortable workspace theme.</p>
            <div className="theme-choices">
              {[
                { key: 'light', icon: Sun, label: 'Light' },
                { key: 'dark', icon: Moon, label: 'Dark' },
                { key: 'system', icon: Monitor, label: 'System' },
              ].map((t) => (
                <button
                  key={t.key}
                  className={prefs.theme === t.key ? 'active' : ''}
                  onClick={() => prefs.set({ theme: t.key as typeof prefs.theme })}
                >
                  <t.icon size={26} />
                  <span>{t.label}</span>
                  {prefs.theme === t.key && <Check size={15} />}
                </button>
              ))}
            </div>
            <div className="preference-row">
              <div>
                <strong>Compact sidebar</strong>
                <p>Keep navigation collapsed on desktop.</p>
              </div>
              <Switch
                label="Compact sidebar"
                checked={prefs.collapsed}
                onCheckedChange={(v) => prefs.set({ collapsed: v })}
              />
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="monitoring preferences">
          <Card className="settings-card">
            <h2>Monitoring defaults</h2>
            <p>Saved locally for your workspace. Apply these preferences with the button below.</p>
            <div className="settings-form">
              <label>
                Preferred states (comma separated)
                <Input
                  value={prefs.preferredStates}
                  onChange={(e) => prefs.set({ preferredStates: e.target.value })}
                  placeholder="Assam, Kerala, Maharashtra"
                />
              </label>
              <label>
                Preferred crisis category
                <Select
                  label="Preferred crisis category"
                  value={prefs.preferredCategories}
                  onChange={(e) => prefs.set({ preferredCategories: e.target.value })}
                >
                  <option value="">All categories</option>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </label>
              <label>
                Default severity filter
                <Select
                  label="Default severity filter"
                  value={prefs.defaultSeverity}
                  onChange={(e) => prefs.set({ defaultSeverity: e.target.value })}
                >
                  <option value="">All severities</option>
                  {severities.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </label>
              <label>
                Refresh preference
                <Select
                  label="Refresh preference"
                  value={prefs.refresh}
                  onChange={(e) => prefs.set({ refresh: e.target.value })}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                  <option value="300">5 minutes</option>
                  <option value="manual">Manual only</option>
                </Select>
              </label>
              <Button
                variant="default"
                onClick={() => {
                  toast.success('Monitoring defaults saved. Open Live Monitoring to use them.');
                }}
              >
                Save monitoring defaults
              </Button>
              <p className="muted">
                Automatic background refresh applies only in API mode. Demo data stays fixed.
              </p>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card className="settings-card">
            <h2>Notifications</h2>
            <p>
              Local preferences for future backend alerts. Replay completion notifications work in
              this demo.
            </p>
            {(
              [
                {
                  key: 'criticalAlerts',
                  title: 'Critical incident alerts',
                  description: 'When a new critical incident is detected.',
                },
                {
                  key: 'escalations',
                  title: 'Incident escalation',
                  description: 'When an incident severity increases.',
                },
                {
                  key: 'sourceAlerts',
                  title: 'Source disconnection',
                  description: 'When an ingestion source becomes unavailable.',
                },
                {
                  key: 'replayAlerts',
                  title: 'Replay completion',
                  description: 'When your historical simulation reaches the end.',
                },
              ] as const
            ).map((n) => (
              <div className="preference-row" key={n.key}>
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.description}</p>
                </div>
                <Switch
                  label={n.title}
                  checked={prefs[n.key]}
                  onCheckedChange={(v) => prefs.set({ [n.key]: v })}
                />
              </div>
            ))}
          </Card>
        </TabsContent>
        <TabsContent value="data & privacy">
          <Card className="settings-card">
            <Shield size={26} />
            <h2>Data & privacy</h2>
            <p>
              Safe preferences and locally generated demo reports are stored in your browser. No API
              keys, authentication credentials, or sensitive reports should be stored here.
            </p>
            <p>
              The map requests OpenStreetMap tiles from a third-party provider. Opening a provider
              website navigates to that provider.
            </p>
            <Button onClick={() => setConfirm(true)}>Reset local preferences</Button>
          </Card>
        </TabsContent>
        <TabsContent value="about">
          <Card className="settings-card">
            <h2>Crisis Lens</h2>
            <p>Real-Time Crisis Intelligence & Historical Analysis</p>
            <p>
              Version 1.0 · Frontend demo. Built for situational awareness and source-aware analysis
              across India.
            </p>
            <p>This product does not replace official emergency warning authorities.</p>
          </Card>
        </TabsContent>
      </Tabs>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Reset local preferences?"
        description="This clears your theme, navigation, and monitoring preferences on this device."
      >
        <Button
          onClick={() => {
            useUI.persist.clearStorage();
            window.location.reload();
          }}
        >
          Reset preferences
        </Button>
        <Button onClick={() => setConfirm(false)}>Cancel</Button>
      </Dialog>
    </div>
  );
}
