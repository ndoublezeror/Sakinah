import { useState } from 'react';
import { Check, Plus, Trash2, Sunrise, Sunset, BookOpen, Sparkles, Heart } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatNumber } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useDailyData } from '@/hooks/useDailyData';

export function TrackerPage() {
  const { lang } = useI18n();
  const { log, points, sunnahLogs, optionalAdhkarLogs, loading, updateLog, toggleSunnah, toggleOptionalAdhkar } = useDailyData();
  const [showAddSunnah, setShowAddSunnah] = useState(false);
  const [showAddAdhkar, setShowAddAdhkar] = useState(false);
  const [newSunnahName, setNewSunnahName] = useState('');
  const [newAdhkarName, setNewAdhkarName] = useState('');

  const prayers = [
    { key: 'fajr', label: t(lang, 'fajr'), points: 3 },
    { key: 'dhuhr', label: t(lang, 'dhuhr'), points: 3 },
    { key: 'asr', label: t(lang, 'asr'), points: 3 },
    { key: 'maghrib', label: t(lang, 'maghrib'), points: 3 },
    { key: 'isha', label: t(lang, 'isha'), points: 3 },
  ] as const;

  const requiredItems = [
    { key: 'quran_read', label: t(lang, 'quranReading'), icon: BookOpen, points: 1 },
  ] as const;

  const adhkarItems = [
    { key: 'morning_adhkar', label: t(lang, 'morningAdhkar'), icon: Sunrise, points: 2 },
    { key: 'evening_adhkar', label: t(lang, 'eveningAdhkar'), icon: Sunset, points: 2 },
  ] as const;

  const sunnahOptions = lang === 'ar'
    ? ['الضحى', 'الوتر', 'الرواتب', 'التهجد']
    : ['Duha', 'Witr', 'Rawatib', 'Tahajjud'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const requiredPct = points ? (points.required_points / points.max_required) * 100 : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'dailyDeeds')}</h1>
        <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-1">{t(lang, 'tagline')}</p>
      </div>

      {/* Points summary */}
      <Card className="flex flex-col items-center py-5">
        <ProgressRing
          percentage={requiredPct}
          size={140}
          label={points ? `${formatNumber(points.required_points, lang)}/${formatNumber(points.max_required, lang)}` : `${formatNumber(0, lang)}/${formatNumber(20, lang)}`}
          sublabel={t(lang, 'requiredPoints')}
        />
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'bonusPoints')}</p>
            <p className="text-lg font-extrabold text-champagne">{points ? formatNumber(points.bonus_points, lang) : 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'totalDailyPoints')}</p>
            <p className="text-lg font-extrabold text-rose">{points ? formatNumber(points.total_points, lang) : 0}</p>
          </div>
        </div>
      </Card>

      {/* Required: Prayers */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-extrabold text-plum dark:text-pink-light flex items-center gap-2">
            <Heart size={18} className="text-rose" />
            {t(lang, 'requiredActivities')}
          </h2>
          <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-1">{lang === 'ar' ? `كل صلاة فريضة تمنحك ${formatNumber(3, lang)} نقاط` : 'Each obligatory prayer gives you 3 points'}</p>
        </div>
        <div className="space-y-3">
          {prayers.map(p => {
            const done = log?.[p.key] ?? false;
            return (
              <button
                key={p.key}
                onClick={() => updateLog({ [p.key]: !done } as never)}
                className={`w-full min-h-[68px] flex items-center justify-between gap-3 px-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${done ? 'bg-gradient-to-r from-pink-primary/25 to-lilac/30 border-pink-primary' : 'bg-gradient-to-r from-pink-primary/10 to-lilac/15 border-pink-primary/35 hover:border-pink-primary/70'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${done ? 'bg-gradient-to-br from-pink-primary to-rose border-rose text-white animate-check-pop' : 'bg-pink-primary/20 border-pink-primary text-transparent'}`}>
                    <Check size={18} />
                  </span>
                  <span className={`font-extrabold ${done ? 'text-rose' : 'text-plum dark:text-pink-light'}`}>{p.label}</span>
                </div>
                <span className="text-xs font-extrabold bg-champagne/35 text-plum px-3 py-1.5 rounded-full whitespace-nowrap">+{formatNumber(p.points, lang)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Required: Adhkar */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-extrabold text-plum dark:text-pink-light flex items-center gap-2">
            <Sparkles size={18} className="text-rose" />
            {lang === 'ar' ? 'الأذكار' : 'Adhkar'}
          </h2>
          <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-1">{lang === 'ar' ? 'أذكار الصباح والمساء' : 'Morning and evening remembrance'}</p>
        </div>
        <div className="space-y-3">
          {adhkarItems.map(item => {
            const done = log?.[item.key] ?? false;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => updateLog({ [item.key]: !done } as never)}
                className={`w-full min-h-[68px] flex items-center justify-between gap-3 px-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${done ? 'bg-gradient-to-r from-pink-primary/25 to-lilac/30 border-pink-primary' : 'bg-gradient-to-r from-pink-primary/10 to-lilac/15 border-pink-primary/35 hover:border-pink-primary/70'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${done ? 'bg-gradient-to-br from-pink-primary to-rose border-rose text-white animate-check-pop' : 'bg-pink-primary/20 border-pink-primary text-pink-primary'}`}>
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <span className={`font-extrabold ${done ? 'text-rose' : 'text-plum dark:text-pink-light'}`}>{item.label}</span>
                </div>
                <span className="text-xs font-extrabold bg-champagne/35 text-plum px-3 py-1.5 rounded-full whitespace-nowrap">+{formatNumber(item.points, lang)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Required: Qur'an */}
      <Card className="p-4 sm:p-5">
        <div className="mb-4">
          <h2 className="font-extrabold text-plum dark:text-pink-light flex items-center gap-2">
            <BookOpen size={18} className="text-rose" />
            {lang === 'ar' ? 'القرآن' : "Qur'an"}
          </h2>
        </div>
        <div className="space-y-3">
          {requiredItems.map(item => {
            const done = log?.[item.key] ?? false;
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => updateLog({ [item.key]: !done } as never)}
                className={`w-full min-h-[68px] flex items-center justify-between gap-3 px-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${done ? 'bg-gradient-to-r from-pink-primary/25 to-lilac/30 border-pink-primary' : 'bg-gradient-to-r from-pink-primary/10 to-lilac/15 border-pink-primary/35 hover:border-pink-primary/70'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${done ? 'bg-gradient-to-br from-pink-primary to-rose border-rose text-white animate-check-pop' : 'bg-pink-primary/20 border-pink-primary text-pink-primary'}`}>
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </span>
                  <span className={`font-extrabold ${done ? 'text-rose' : 'text-plum dark:text-pink-light'}`}>{lang === 'ar' ? 'أكمل قراءة اليوم' : "Mark today's reading"}</span>
                </div>
                <span className="text-xs font-extrabold bg-champagne/35 text-plum px-3 py-1.5 rounded-full whitespace-nowrap">+{formatNumber(item.points, lang)}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Optional: Sunnah prayers */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-extrabold text-plum dark:text-pink-light flex items-center gap-2">
              <Sparkles size={18} className="text-champagne" />
              {t(lang, 'sunnahPrayers')} <span className="text-xs font-normal text-plum/55 dark:text-pink-light/55">({lang === 'ar' ? 'اختياري' : 'optional'})</span>
            </h2>
            <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-1">{lang === 'ar' ? `كل صلاة سنة تمنحك نقطة واحدة` : 'Each Sunnah prayer you tick gives you 1 point'}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddSunnah(true)}>
            <Plus size={14} /> {t(lang, 'add')}
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {sunnahOptions.map(name => {
            const done = sunnahLogs.some(s => s.prayer_name.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                onClick={() => toggleSunnah(name)}
                className={`min-h-[68px] flex items-center justify-between gap-3 px-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${done ? 'bg-gradient-to-r from-pink-primary/25 to-lilac/30 border-pink-primary' : 'bg-gradient-to-r from-pink-primary/10 to-lilac/15 border-pink-primary/35 hover:border-pink-primary/70'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-gradient-to-br from-pink-primary to-rose border-rose text-white animate-check-pop' : 'bg-pink-primary/20 border-pink-primary text-transparent'}`}>
                    <Check size={18} />
                  </span>
                  <span className={`font-extrabold ${done ? 'text-rose' : 'text-plum dark:text-pink-light'}`}>{name}</span>
                </div>
                <span className="text-xs font-extrabold bg-champagne/35 text-plum px-3 py-1.5 rounded-full">+{formatNumber(1, lang)}</span>
              </button>
            );
          })}
        </div>
        {sunnahLogs.filter(s => !sunnahOptions.some(name => name.toLowerCase() === s.prayer_name.toLowerCase())).map(s => (
          <div key={s.id} className="mt-3 flex items-center justify-between min-h-[60px] px-4 rounded-2xl border-2 border-pink-primary/35 bg-gradient-to-r from-pink-primary/10 to-lilac/15">
            <span className="font-extrabold text-plum dark:text-pink-light">{s.prayer_name}</span>
            <button onClick={() => toggleSunnah(s.prayer_name)} className="text-red-400 p-2"><Trash2 size={16} /></button>
          </div>
        ))}
      </Card>

      {/* Optional: Additional adhkar */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-extrabold text-plum dark:text-pink-light flex items-center gap-2">
              <Sparkles size={18} className="text-lilac-dark" />
              {t(lang, 'addOptionalAdhkar')}
            </h2>
            <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-1">{lang === 'ar' ? 'أذكار إضافية اختيارية' : 'Optional additional remembrance'}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddAdhkar(true)}>
            <Plus size={14} /> {t(lang, 'add')}
          </Button>
        </div>
        <div className="space-y-3 mt-4">
          {optionalAdhkarLogs.length === 0 ? (
            <p className="text-sm text-plum/40 dark:text-pink-light/40 text-center py-4">{t(lang, 'noData')}</p>
          ) : optionalAdhkarLogs.map(a => (
            <div key={a.id} className="flex items-center justify-between min-h-[60px] px-4 rounded-2xl border-2 border-pink-primary/35 bg-gradient-to-r from-pink-primary/10 to-lilac/15">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-primary to-rose text-white"><Check size={18} /></span>
                <span className="font-extrabold text-plum dark:text-pink-light">{a.adhkar_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold bg-champagne/35 text-plum px-3 py-1.5 rounded-full">+{formatNumber(1, lang)}</span>
                <button onClick={() => toggleOptionalAdhkar(a.adhkar_name)} className="p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tasbih link */}
      <Card className="p-4 sm:p-5 bg-gradient-to-r from-pink-primary/15 to-lilac/25" onClick={() => window.location.hash = '#/tasbih'}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-primary to-rose text-white flex items-center justify-center"><Sparkles size={18} /></span>
            <div>
              <h2 className="font-extrabold text-plum dark:text-pink-light">{t(lang, 'tasbihCounter')}</h2>
              <p className="text-xs text-plum/55 dark:text-pink-light/55">{lang === 'ar' ? `أكمل ${formatNumber(33, lang)} تسبيحة لتحصل على نقطة إضافية` : 'Complete 33 counts for 1 bonus point'}</p>
            </div>
          </div>
          <span className="text-rose text-xl">→</span>
        </div>
      </Card>

      {/* Add Sunnah modal */}
      <Modal open={showAddSunnah} onClose={() => setShowAddSunnah(false)} title={t(lang, 'addSunnah')}>
        <div className="space-y-4">
          <Input
            label={t(lang, 'sunnahPrayers')}
            value={newSunnahName}
            onChange={e => setNewSunnahName(e.target.value)}
            placeholder={lang === 'ar' ? 'مثال: سنة الفجر' : 'e.g. Fajr Sunnah'}
          />
          <Button fullWidth onClick={async () => {
            if (newSunnahName.trim()) {
              await toggleSunnah(newSunnahName.trim());
              setNewSunnahName('');
              setShowAddSunnah(false);
            }
          }}>
            {t(lang, 'add')}
          </Button>
        </div>
      </Modal>

      {/* Add Adhkar modal */}
      <Modal open={showAddAdhkar} onClose={() => setShowAddAdhkar(false)} title={t(lang, 'addOptionalAdhkar')}>
        <div className="space-y-4">
          <Input
            label={t(lang, 'customAdhkarName')}
            value={newAdhkarName}
            onChange={e => setNewAdhkarName(e.target.value)}
            placeholder={lang === 'ar' ? 'مثال: أذكار النوم' : 'e.g. Sleep adhkar'}
          />
          <Button fullWidth onClick={async () => {
            if (newAdhkarName.trim()) {
              await toggleOptionalAdhkar(newAdhkarName.trim());
              setNewAdhkarName('');
              setShowAddAdhkar(false);
            }
          }}>
            {t(lang, 'add')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
