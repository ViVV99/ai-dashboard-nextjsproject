'use client';

import { ErrorPanel, type ErrorBoundaryProps } from '@/components/error-panel';

export default function DashboardError({ error, retry }: ErrorBoundaryProps) {
  return <ErrorPanel error={error} retry={retry} />;
}
