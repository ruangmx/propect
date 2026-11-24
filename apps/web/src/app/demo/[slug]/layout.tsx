import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Demonstrações são enviadas por link direto ao lead e não devem aparecer em buscadores.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return children;
}
