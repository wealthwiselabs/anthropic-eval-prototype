import { useEffect, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  width?: number;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  children: ReactNode;
  ariaLabel?: string;
};

// Shared modal shell: fixed backdrop, centered container, escape-to-close,
// and optional click-outside-to-close. Bodies (headers/footers/forms) are
// supplied by callers — this just owns the chrome and the dismissal hooks.
export function Modal({
  open,
  onClose,
  width = 520,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  children,
  ariaLabel,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-6"
      onClick={() => {
        if (closeOnBackdropClick) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={{ width: '100%', maxWidth: width }}
        className="bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
