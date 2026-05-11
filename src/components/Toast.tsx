import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useStore } from '../store/useStore';

// Bottom-center notification. Auto-dismisses after 5s; manual close + an
// optional action link. Mounted once inside ConsoleChrome so any view can
// fire `useStore.getState().showToast(...)` without prop drilling.
const VISIBLE_MS = 5_000;

export function Toast() {
  const toast = useStore((s) => s.toast);
  const dismissToast = useStore((s) => s.dismissToast);
  const [mounted, setMounted] = useState(false);

  // Track when a toast appears to drive the enter transition. Key the
  // animation off toast.id so back-to-back toasts re-trigger it.
  useEffect(() => {
    if (!toast) {
      setMounted(false);
      return;
    }
    // next paint → trigger transition into visible state
    const enter = requestAnimationFrame(() => setMounted(true));
    const timer = setTimeout(() => dismissToast(), VISIBLE_MS);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(timer);
    };
  }, [toast, dismissToast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-50 flex justify-center">
      <div
        className={
          'pointer-events-auto flex items-center gap-3 bg-ink text-white rounded-lg shadow-lg px-4 py-3 text-sm transition-all duration-200 ' +
          (mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2')
        }
      >
        <span className="leading-snug">{toast.message}</span>
        {toast.actionLabel && toast.actionTo && (
          <Link
            to={toast.actionTo}
            onClick={dismissToast}
            className="text-coral hover:text-white underline underline-offset-2 font-medium"
          >
            {toast.actionLabel}
          </Link>
        )}
        <button
          onClick={dismissToast}
          aria-label="Dismiss"
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
