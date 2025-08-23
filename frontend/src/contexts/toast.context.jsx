// src/contexts/toast.context.jsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FiCheckCircle, FiInfo, FiX, FiXCircle } from 'react-icons/fi';
import banner from '../assets/banner.png';

const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const genId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const TYPE_STYLES = {
  success: {
    icon: <FiCheckCircle className="text-emerald-200" size={22} aria-hidden />,
    accent: 'ring-emerald-300/70',
    text: 'text-emerald-50',
    title: 'text-emerald-100',
    button: 'text-emerald-50 hover:bg-white/20',
    bar: 'from-emerald-200/60 via-emerald-100/80 to-emerald-200/60',
    label: 'Success',
  },
  error: {
    icon: <FiXCircle className="text-rose-200" size={22} aria-hidden />,
    accent: 'ring-rose-300/70',
    text: 'text-rose-50',
    title: 'text-rose-100',
    button: 'text-rose-50 hover:bg-white/20',
    bar: 'from-rose-200/60 via-rose-100/80 to-rose-200/60',
    label: 'Error',
  },
  info: {
    icon: <FiInfo className="text-sky-200" size={22} aria-hidden />,
    accent: 'ring-sky-300/70',
    text: 'text-sky-50',
    title: 'text-sky-100',
    button: 'text-sky-50 hover:bg-white/20',
    bar: 'from-sky-200/60 via-sky-100/80 to-sky-200/60',
    label: 'Info',
  },
};

export function ToastProvider({ children, maxToasts = 5, defaultDuration = 3500, position = 'top-right' }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  // Cleanup timers on unmount
  useEffect(() => () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback((message, opts = {}) => {
    const id = genId();
    const toast = {
      id,
      message,
      type: opts.type || 'info',
      title: opts.title,
      duration: typeof opts.duration === 'number' ? opts.duration : defaultDuration,
    };
    setToasts((prev) => {
      const next = [...prev, toast];
      if (next.length > maxToasts) next.shift();
      return next;
    });
    const timer = setTimeout(() => remove(id), toast.duration);
    timers.current.set(id, timer);
    return id;
  }, [defaultDuration, maxToasts, remove]);

  const api = useMemo(() => ({
    show,
    success: (msg, opts) => show(msg, { ...opts, type: 'success' }),
    error: (msg, opts) => show(msg, { ...opts, type: 'error' }),
    info: (msg, opts) => show(msg, { ...opts, type: 'info' }),
    remove,
  }), [show, remove]);

  const containerPositionClass = useMemo(() => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  }, [position]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toasts Container */}
      <div className={`pointer-events-none fixed z-[1000] ${containerPositionClass} flex max-h-[100svh] w-full max-w-[92vw] flex-col items-stretch gap-3 sm:max-w-[28rem]`}>
        {toasts.map((t) => {
          const conf = TYPE_STYLES[t.type] || TYPE_STYLES.info;
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`relative  bg-white pointer-events-auto overflow-hidden rounded-xl border border-white/20 shadow-xl ring-2 ${conf.accent}`}
              style={{
                transform: 'translateY(0)',
                transition: 'transform 220ms ease, opacity 220ms ease',
                background: 'transparent',
              }}
            >
              {/* Background image layer with 0.8 opacity */}
              <img
                src={banner}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />
              {/* Subtle dark overlay for readability */}
              <div className="absolute inset-0 bg-black/50" aria-hidden />

              {/* Content */}
              <div className="relative z-10 flex items-start gap-3 p-4 backdrop-blur-[2px]">
                <div className="shrink-0">{conf.icon}</div>
                <div className={`min-w-0 flex-1 ${conf.text}`}>
                  {t.title ? (
                    <div className={`mb-0.5 text-sm font-semibold tracking-wide drop-shadow ${conf.title}`}>{t.title}</div>
                  ) : null}
                  <div className="text-[0.95rem] leading-snug drop-shadow-sm break-words">{t.message}</div>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => remove(t.id)}
                  className={`-m-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 transition ${conf.button}`}
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Accent progress bar (auto-dismiss hint) */}
              <div className="relative z-10 h-1 w-full bg-white/10">
                <div
                  className={`h-full bg-gradient-to-r ${conf.bar}`}
                  style={{
                    width: '100%',
                    animation: `toast-progress ${Math.max(800, t.duration)}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Local keyframes for progress bar */}
      <style>{`
        @keyframes toast-progress { from { transform: translateX(-100%); } to { transform: translateX(0%); } }
      `}</style>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
