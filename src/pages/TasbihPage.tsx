import { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, Check, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatNumber } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useDailyData } from '@/hooks/useDailyData';

export function TasbihPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const { logDate, dhikrSessions, saveDhikrSession } = useDailyData();
  const [count, setCount] = useState(0);
  const [milestoneToast, setMilestoneToast] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const savingRef = useRef(false);
  const lastSavedTotalRef = useRef(0);
  const pendingSyncRef = useRef(false);

  const dhikrPhrases = lang === 'ar'
    ? ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'اللهم صل على محمد']
    : ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illa Allah', 'Astaghfirullah', 'Allahumma salli ala Muhammad'];

  const currentPhrase = dhikrPhrases[dhikrIndex];
  const reached33 = count >= 33;
  const savedDbCount = dhikrSessions.reduce((sum, s) => sum + s.count, 0);
  const bonusEarnedToday = Math.floor(savedDbCount / 33);

  const storageKey = user ? `noor-club-tasbih:${user.id}:${logDate}` : null;

  const persistLocal = useCallback((c: number, idx: number) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ count: c, dhikrIndex: idx, ts: Date.now() }));
    } catch { /* ignore quota errors */ }
  }, [storageKey]);

  const clearLocal = useCallback(() => {
    if (!storageKey) return;
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
  }, [storageKey]);

  const doSave = useCallback(async (totalCount: number) => {
    if (!user || savingRef.current) return;
    savingRef.current = true;
    try {
      await saveDhikrSession(totalCount);
      lastSavedTotalRef.current = totalCount;
    } finally {
      savingRef.current = false;
    }
  }, [user, saveDhikrSession]);

  // Sync lastSavedTotalRef when DB sessions change (e.g., after fetchAll or save)
  useEffect(() => {
    lastSavedTotalRef.current = savedDbCount;
  }, [savedDbCount]);

  // Reset when day changes
  useEffect(() => {
    setCount(0);
    setMilestoneToast(null);
    setRestored(false);
  }, [logDate]);

  // Initialize count from DB total when sessions first load, or restore from localStorage if DB is empty
  useEffect(() => {
    if (!user) return;
    if (savedDbCount > 0) {
      setCount(savedDbCount);
      clearLocal();
    } else {
      try {
        const raw = localStorage.getItem(storageKey || '');
        if (raw) {
          const saved = JSON.parse(raw) as { count: number; dhikrIndex: number };
          if (saved.count > 0) {
            setCount(saved.count);
            setDhikrIndex(saved.dhikrIndex || 0);
            setRestored(true);
          }
        }
      } catch { /* ignore */ }
    }
  }, [user, savedDbCount, storageKey, clearLocal]);

  // Auto-clear toasts
  useEffect(() => {
    if (milestoneToast !== null) {
      const timer = setTimeout(() => setMilestoneToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [milestoneToast]);

  useEffect(() => {
    if (restored) {
      const timer = setTimeout(() => setRestored(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [restored]);

  const handleTap = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    persistLocal(nextCount, dhikrIndex);

    const prevMilestone = Math.floor(lastSavedTotalRef.current / 33);
    const newMilestone = Math.floor(nextCount / 33);

    if (newMilestone > prevMilestone) {
      setMilestoneToast(newMilestone * 33);
      void doSave(nextCount);
      clearLocal();
    } else if (nextCount % 5 === 0) {
      void doSave(nextCount);
    }
  };

  const handleReset = () => {
    setCount(savedDbCount);
    clearLocal();
  };

  const selectDhikr = (index: number) => {
    setDhikrIndex(index);
    setCount(savedDbCount);
    persistLocal(savedDbCount, index);
  };

  // Sync unsaved progress when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (count > 0 && !pendingSyncRef.current) {
        pendingSyncRef.current = true;
        void doSave(count).then(() => {
          pendingSyncRef.current = false;
        });
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [count, doSave]);

  // Sync on unmount / page hide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && count > 0) {
        void doSave(count);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [count, doSave]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'tasbihCounter')}</h1>
        <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-1">{t(lang, 'tapToCount')}</p>
      </div>

      {/* Choose a dhikr */}
      <Card className="p-4 sm:p-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-plum/60 dark:text-pink-light/60 mb-3">
          {lang === 'ar' ? 'اختاري ذكراً' : 'Choose a dhikr'}
        </p>
        <div className="flex flex-wrap gap-2">
          {dhikrPhrases.map((phrase, index) => (
            <button
              key={phrase}
              onClick={() => selectDhikr(index)}
              className={`px-4 py-2 rounded-full border text-sm font-extrabold transition-all active:scale-95 font-arabic ${index === dhikrIndex ? 'bg-pink-primary/25 border-rose text-plum dark:text-pink-light shadow-sm' : 'bg-card border-pink-primary/25 text-plum/60 dark:text-pink-light/60 hover:border-rose hover:text-rose'}`}
            >
              {phrase}
            </button>
          ))}
        </div>
      </Card>

      {/* Bonus status */}
      <Card className={`text-center py-4 ${bonusEarnedToday > 0 ? 'bg-gradient-to-r from-champagne/15 to-pink-primary/10' : ''}`}>
        {bonusEarnedToday > 0 ? (
          <div className="flex items-center justify-center gap-2 text-champagne">
            <Check size={20} className="fill-champagne" />
            <span className="font-bold text-sm">
              {formatNumber(bonusEarnedToday, lang)} {t(lang, 'point')}{bonusEarnedToday > 1 && lang === 'en' ? 's' : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-plum/50 dark:text-pink-light/50">
            <Sparkles size={18} />
            <span className="font-bold text-sm">{t(lang, 'notYetEarned')}</span>
          </div>
        )}
      </Card>

      {/* Milestone toast */}
      {milestoneToast !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-pop-in">
          <div className="bg-gradient-to-r from-pink-primary to-rose text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <Heart size={18} className="fill-white" />
            <span className="font-bold text-sm">
              {formatNumber(milestoneToast, lang)} {t(lang, 'milestoneReached')} 🌸
            </span>
          </div>
        </div>
      )}

      {/* Restored toast */}
      {restored && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-pop-in">
          <div className="bg-champagne text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <Check size={18} className="fill-white" />
            <span className="font-bold text-sm">{t(lang, 'progressRestored')}</span>
          </div>
        </div>
      )}

      {/* Counter */}
      <Card className="flex flex-col items-center py-10 sm:py-14 min-h-[430px] justify-center">
        <button
          onClick={() => selectDhikr(dhikrIndex)}
          className="text-xl font-extrabold text-plum dark:text-pink-light mb-5 font-arabic"
        >
          {currentPhrase}
        </button>

        <button
          onClick={handleTap}
          aria-label={t(lang, 'tapToCount')}
          className={`w-64 h-64 sm:w-72 sm:h-72 rounded-full border-[14px] border-pink-primary/25 ring-8 ring-pink-primary/10 flex flex-col items-center justify-center transition-all active:scale-95 select-none ${reached33 ? 'bg-gradient-to-br from-pink-primary to-rose animate-gentle-pulse shadow-xl shadow-pink-primary/40' : 'bg-gradient-to-br from-pink-primary/25 to-lilac shadow-lg'}`}
        >
          <span className={`text-6xl sm:text-7xl font-extrabold ${reached33 ? 'text-white' : 'text-plum dark:text-pink-light'}`}>
            {formatNumber(count, lang)}
          </span>
          <span className={`text-xs font-bold mt-2 ${reached33 ? 'text-white/80' : 'text-plum/50 dark:text-pink-light/50'}`}>
            {t(lang, 'tapToCount')}
          </span>
        </button>

        {reached33 && (
          <div className="mt-4 animate-pop-in flex items-center gap-2 text-rose font-bold">
            <Heart size={18} className="fill-rose text-rose" />
            {t(lang, 'keepGoing')}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw size={16} /> {t(lang, 'reset')}
          </Button>
        </div>
      </Card>

      {/* Today's sessions */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm">{t(lang, 'todaysSessions')}</h2>
        {dhikrSessions.length === 0 ? (
          <p className="text-sm text-plum/40 dark:text-pink-light/40 text-center py-4">{t(lang, 'noData')}</p>
        ) : (
          <div className="space-y-2">
            {dhikrSessions.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-blush dark:bg-plum-dark/30">
                <span className="font-bold text-plum dark:text-pink-light text-sm">#{formatNumber(i + 1, lang)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-rose">{formatNumber(s.count, lang)}</span>
                  <span className="text-xs bg-champagne/20 text-champagne font-bold px-2 py-0.5 rounded-full">
                    {formatNumber(Math.floor(s.count / 33), lang)} {t(lang, 'points')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
