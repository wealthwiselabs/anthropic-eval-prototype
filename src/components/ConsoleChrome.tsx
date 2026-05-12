import type { ReactNode } from 'react';
import { LeftNav } from './LeftNav';
import { DisclaimerFooter } from './DisclaimerFooter';
import { Toast } from './Toast';

// Wraps every route in the Console chrome (left nav + main area + footer).
// Simpler than the M1 Agent Builder chrome because Evals has no Builder/Wizard
// header variants — every Evals route shares the same product-title bar.
export function ConsoleChrome({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-canvas">
      <LeftNav />
      <main className="ml-60 flex flex-col min-w-0 relative min-h-screen">
        <header className="h-12 flex items-center px-6 border-b border-border bg-chrome">
          <span className="font-serif text-[15px] text-ink">Evals</span>
        </header>
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <DisclaimerFooter />
      </main>
      <Toast />
    </div>
  );
}
