'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUI, defaultViews } from '@/stores/ui-store';
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const view = useUI.getState().defaultView;
    router.replace(defaultViews.some((value) => value === view) ? view : '/dashboard');
  }, [router]);
  return <div className="empty-state">Opening your workspace…</div>;
}
