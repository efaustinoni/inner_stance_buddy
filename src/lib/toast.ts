// Created: 2026-04-07
// Last Updated: 2026-04-07

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

type Listener = (toasts: ToastMessage[]) => void;

let toasts: ToastMessage[] = [];
let listeners: Listener[] = [];
const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

function add(type: ToastType, message: string) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const entry: ToastMessage = { id, type, message };

  // Keep max 3 toasts — drop oldest if needed
  if (toasts.length >= MAX_TOASTS) {
    toasts = toasts.slice(-(MAX_TOASTS - 1));
  }
  toasts = [...toasts, entry];
  notify();

  setTimeout(() => {
    remove(id);
  }, AUTO_DISMISS_MS);
}

function remove(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function subscribe(listener: Listener): () => void {
  listeners.push(listener);
  listener([...toasts]);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export const toast = {
  success: (message: string) => add('success', message),
  error: (message: string) => add('error', message),
  info: (message: string) => add('info', message),
  remove,
  subscribe,
};
