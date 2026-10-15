import { type RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
'a[href]',
'button:not([disabled])',
'textarea:not([disabled])',
'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
'select:not([disabled])',
'[tabindex]:not([tabindex="-1"])'].
join(',');

/** Open dialogs, innermost last — only the top dialog handles keyboard events. */
const dialogStack: symbol[] = [];

interface DialogA11yOptions {
  open: boolean;
  onClose: () => void;
  /** Element to focus on open. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement>;
}

/**
 * Modal accessibility: moves focus into the dialog, traps Tab/Shift+Tab,
 * closes on Escape and restores focus to the trigger on close.
 * Stack-aware so nested dialogs (feedback log over the assistant) behave correctly.
 */
export function useDialogA11y<T extends HTMLElement>(
containerRef: RefObject<T>,
{ open, onClose, initialFocusRef }: DialogA11yOptions)
{
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const token = Symbol('dialog');
    dialogStack.push(token);
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const container = containerRef.current;

    const getFocusable = () =>
    container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    const initialTarget = initialFocusRef?.current ?? getFocusable()[0] ?? container;
    initialTarget?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== token) return;

      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !container) return;

      const items = getFocusable();
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const focusOutside = !container.contains(active);

      if (event.shiftKey && (active === first || focusOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || focusOutside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = dialogStack.indexOf(token);
      if (index >= 0) dialogStack.splice(index, 1);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [open, containerRef, initialFocusRef]);
}