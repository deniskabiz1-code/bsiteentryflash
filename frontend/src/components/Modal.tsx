import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from '@/context/OverlayContext';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const { registerOverlay, unregisterOverlay } = useOverlay();

  useEffect(() => {
    if (!open) return;
    registerOverlay();
    return unregisterOverlay;
  }, [open, registerOverlay, unregisterOverlay]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-5 pb-8"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-app-surface p-6 shadow-float"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}