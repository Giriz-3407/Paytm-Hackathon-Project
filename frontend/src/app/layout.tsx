import { LIVE } from '@/lib/live';
import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import './globals.css';
import './readability.css';
import './theme.css';
import { AppProviders } from '@/providers/app-providers';
import { AppShell } from '@/components/layout/app-shell';
export const metadata: Metadata = {
  title: 'Crisis Lens — Crisis Intelligence',
  description:
    'Source-aware crisis intelligence and historical analysis across India. ' +
    (LIVE
      ? 'Unverified, news-derived incident tracking.'
      : 'Illustrative frontend demonstration.') +
    '',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
