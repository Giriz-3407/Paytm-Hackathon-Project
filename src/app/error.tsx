'use client';
import { ErrorState } from '@/components/shared/feedback';
export default function Error({ reset }: { reset: () => void }) {
  return <ErrorState retry={reset} />;
}
