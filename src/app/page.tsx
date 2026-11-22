'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUI } from '@/stores/ui-store';
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(useUI.getState().defaultView);
  }, [router]);
  return <div className="empty-state">Opening your workspace…</div>;
}
