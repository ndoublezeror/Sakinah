import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sakinah-reminder';
const LAST_SHOWN_KEY = 'sakinah-reminder-last-shown';

export type ReminderSettings = {
  enabled: boolean;
  time: string; // "HH:MM" 24h format
  notificationsGranted: boolean;
};

const defaultSettings: ReminderSettings = {
  enabled: false,
  time: '09:00',
  notificationsGranted: false,
};

function loadSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled ?? false,
      time: parsed.time ?? '09:00',
      notificationsGranted: parsed.notificationsGranted ?? false,
    };
  } catch {
    return defaultSettings;
  }
}

function saveSettings(settings: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function wasShownToday(): boolean {
  return localStorage.getItem(LAST_SHOWN_KEY) === getTodayKey();
}

function markShownToday() {
  localStorage.setItem(LAST_SHOWN_KEY, getTodayKey());
}

function timeUntilNext(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

export type ReminderHook = {
  settings: ReminderSettings;
  toggleEnabled: () => void;
  setTime: (time: string) => void;
  requestNotificationPermission: () => Promise<void>;
  permission: NotificationPermission | 'unsupported';
  shouldShowInApp: boolean;
  dismissInApp: () => void;
};

export function useReminder(): ReminderHook {
  const [settings, setSettings] = useState<ReminderSettings>(loadSettings);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [shouldShowInApp, setShouldShowInApp] = useState(false);

  const updateSettings = useCallback((updater: (prev: ReminderSettings) => ReminderSettings) => {
    setSettings(prev => {
      const next = updater(prev);
      saveSettings(next);
      return next;
    });
  }, []);

  const fireReminder = useCallback(() => {
    const message = "Don't forget your Sakinah \u{1F90D}";
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('Sakinah', {
          body: message,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: 'sakinah-daily',
        });
      } catch {
        setShouldShowInApp(true);
      }
    } else {
      setShouldShowInApp(true);
    }
    markShownToday();
  }, []);

  // Schedule/re-schedule notification timer when settings change
  useEffect(() => {
    if (!settings.enabled) return;

    // Check on mount if we missed today's reminder
    if (!wasShownToday()) {
      const [h, m] = settings.time.split(':').map(Number);
      const now = new Date();
      const todayTarget = new Date();
      todayTarget.setHours(h, m, 0, 0);
      // If current time is past the target time today, show it now
      if (now.getTime() >= todayTarget.getTime()) {
        const timeout = setTimeout(() => fireReminder(), 2000);
        return () => clearTimeout(timeout);
      }
    }

    // Schedule for the next occurrence
    const ms = timeUntilNext(settings.time);
    const timer = setTimeout(() => {
      if (!wasShownToday()) {
        fireReminder();
      }
      // After firing, set up daily interval (every 24h)
      const interval = setInterval(() => {
        if (!wasShownToday()) {
          fireReminder();
        }
      }, 24 * 60 * 60 * 1000);
      // Store interval for cleanup — we return a cleanup below
      (window as never as { __sakinahReminderInterval?: ReturnType<typeof setInterval> }).__sakinahReminderInterval = interval;
    }, ms);

    return () => {
      clearTimeout(timer);
      const w = window as never as { __sakinahReminderInterval?: ReturnType<typeof setInterval> };
      if (w.__sakinahReminderInterval) {
        clearInterval(w.__sakinahReminderInterval);
        w.__sakinahReminderInterval = undefined;
      }
    };
  }, [settings.enabled, settings.time, fireReminder]);

  // On app open: show in-app if reminder is enabled, notifications unavailable, and not shown today
  useEffect(() => {
    if (settings.enabled && !wasShownToday() && (permission === 'denied' || permission === 'unsupported')) {
      const [h, m] = settings.time.split(':').map(Number);
      const now = new Date();
      const todayTarget = new Date();
      todayTarget.setHours(h, m, 0, 0);
      if (now.getTime() >= todayTarget.getTime()) {
        setShouldShowInApp(true);
        markShownToday();
      }
    }
  }, [settings.enabled, settings.time, permission]);

  const toggleEnabled = useCallback(() => {
    updateSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, [updateSettings]);

  const setTime = useCallback((time: string) => {
    updateSettings(prev => ({ ...prev, time }));
  }, [updateSettings]);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      updateSettings(prev => ({ ...prev, notificationsGranted: true }));
    }
  }, [updateSettings]);

  const dismissInApp = useCallback(() => {
    setShouldShowInApp(false);
    markShownToday();
  }, []);

  return {
    settings,
    toggleEnabled,
    setTime,
    requestNotificationPermission,
    permission,
    shouldShowInApp,
    dismissInApp,
  };
}
