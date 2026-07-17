import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useOverlay } from '@/context/OverlayContext';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export default function Modal({ open, onClose, children }: ModalProps) {
  const { registerOverlay, unregisterOverlay } = useOverlay();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const timer = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    registerOverlay();
    return unregisterOverlay;
  }, [mounted, registerOverlay, unregisterOverlay]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-5 pb-8 ${
        closing ? 'modal-backdrop-out' : 'modal-backdrop'
      }`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full max-w-sm rounded-3xl bg-app-surface p-6 shadow-float ${
          closing ? 'modal-sheet-out' : 'modal-sheet'
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
