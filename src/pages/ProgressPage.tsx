import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Award, Flame } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatNumber, type TranslationKey } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { supabase } from '@/lib/supabase';

type DayData = {
  log_date: string;
  fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean;
  quran_read: boolean; morning_adhkar: boolean; evening_adhkar: boolean;
};

const dayLabels: TranslationKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function ProgressPage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<{ key: TranslationKey; desc: TranslationKey; earned: boolean }[]>([]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('log_date', { ascending: false })
        .limit(7);
      setWeekData((data || []) as DayData[]);

      // Calculate achievements
      const allLogs = (data || []) as DayData[];
      const totalDays = allLogs.length;
      const perfectDays = allLogs.filter(d => d.fajr && d.dhuhr && d.asr && d.maghrib && d.isha && d.quran_read && d.morning_adhkar && d.evening_adhkar).length;

      // Streak
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateStr = checkDate.toISOString().split('T')[0];
        const entry = allLogs.find(d => d.log_date === dateStr);
        if (entry && (entry.fajr || entry.dhuhr || entry.asr || entry.maghrib || entry.isha)) {
          streak++;
        } else if (i > 0) break;
      }

      // Quran days
      const quranDays = allLogs.filter(d => d.quran_read).length;

      // Dhikr sessions
      const { count: dhikrCount } = await supabase
        .from('dhikr_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .gte('count', 33);

      // Knowledge contributions
      const { count: knowledgeCount } = await supabase
        .from('knowledge_contributions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      const achDefs: { key: TranslationKey; desc: TranslationKey; earned: boolean }[] = [
        { key: 'achFirstStep', desc: 'achFirstStepDesc', earned: totalDays >= 1 },
        { key: 'achWeekStreak', desc: 'achWeekStreakDesc', earned: streak >= 7 },
        { key: 'achQuranReader', desc: 'achQuranReaderDesc', earned: quranDays >= 7 },
        { key: 'achDhikrMaster', desc: 'achDhikrMasterDesc', earned: (dhikrCount || 0) >= 10 },
        { key: 'achScholar', desc: 'achScholarDesc', earned: (knowledgeCount || 0) >= 5 },
        { key: 'achPerfectDay', desc: 'achPerfectDayDesc', earned: perfectDays >= 1 },
      ];
      setAchievements(achDefs);
      setLoading(false);
    })();
  }, [profile]);

  // Calculate stats
  const totalRequired = weekData.reduce((sum, d) => {
    let pts = 0;
    if (d.fajr) pts += 3;
    if (d.dhuhr) pts += 3;
    if (d.asr) pts += 3;
    if (d.maghrib) pts += 3;
    if (d.isha) pts += 3;
    if (d.quran_read) pts += 1;
    if (d.morning_adhkar) pts += 2;
    if (d.evening_adhkar) pts += 2;
    return sum + pts;
  }, 0);

  const avgDaily = weekData.length > 0 ? Math.round(totalRequired / weekData.length) : 0;
  const bestDay = weekData.reduce((best, d) => {
    let pts = 0;
    if (d.fajr) pts += 3; if (d.dhuhr) pts += 3; if (d.asr) pts += 3; if (d.maghrib) pts += 3; if (d.isha) pts += 3;
    if (d.quran_read) pts += 1; if (d.morning_adhkar) pts += 2; if (d.evening_adhkar) pts += 2;
    return pts > best.pts ? { date: d.log_date, pts } : best;
  }, { date: '', pts: 0 });

  const completionRate = weekData.length > 0
    ? Math.round((totalRequired / (weekData.length * 20)) * 100)
    : 0;

  // Last 7 days breakdown (reverse for chronological order)
  const last7 = [...weekData].reverse();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <BarChart3 size={28} className="text-rose mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'weeklyProgress')}</h1>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center py-5">
          <p className="text-xs text-plum/60 dark:text-pink-light/60 font-bold mb-1">{t(lang, 'totalPoints')}</p>
          <p className="text-3xl font-extrabold text-rose">{formatNumber(totalRequired, lang)}</p>
        </Card>
        <Card className="text-center py-5">
          <p className="text-xs text-plum/60 dark:text-pink-light/60 font-bold mb-1">{t(lang, 'avgDaily')}</p>
          <p className="text-3xl font-extrabold text-champagne">{formatNumber(avgDaily, lang)}</p>
        </Card>
        <Card className="text-center py-5">
          <p className="text-xs text-plum/60 dark:text-pink-light/60 font-bold mb-1">{t(lang, 'bestDay')}</p>
          <p className="text-2xl font-extrabold text-plum dark:text-pink-light">{bestDay.pts > 0 ? formatNumber(bestDay.pts, lang) : '—'}</p>
        </Card>
        <Card className="text-center py-5">
          <p className="text-xs text-plum/60 dark:text-pink-light/60 font-bold mb-1">{t(lang, 'completionRate')}</p>
          <p className="text-3xl font-extrabold text-lilac-dark">{formatNumber(completionRate, lang)}%</p>
        </Card>
      </div>

      {/* Completion ring */}
      <Card className="flex flex-col items-center py-6">
        <ProgressRing
          percentage={completionRate}
          size={160}
          label={`${formatNumber(completionRate, lang)}%`}
          sublabel={t(lang, 'completionRate')}
        />
      </Card>

      {/* Daily breakdown */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-rose" />
          {t(lang, 'dailyBreakdown')}
        </h2>
        <div className="space-y-2">
          {last7.length === 0 ? (
            <p className="text-sm text-plum/40 dark:text-pink-light/40 text-center py-4">{t(lang, 'noData')}</p>
          ) : last7.map((d) => {
            let pts = 0;
            if (d.fajr) pts += 3; if (d.dhuhr) pts += 3; if (d.asr) pts += 3; if (d.maghrib) pts += 3; if (d.isha) pts += 3;
            if (d.quran_read) pts += 1; if (d.morning_adhkar) pts += 2; if (d.evening_adhkar) pts += 2;
            const pct = (pts / 20) * 100;
            const dayNum = new Date(d.log_date).getDay();
            return (
              <div key={d.log_date} className="flex items-center gap-3">
                <span className="text-xs font-bold text-plum/60 dark:text-pink-light/60 w-12 flex-shrink-0">{t(lang, dayLabels[dayNum])}</span>
                <div className="flex-1 h-6 rounded-full bg-blush dark:bg-plum-dark/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-primary to-rose rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-rose w-8 text-end flex-shrink-0">{formatNumber(pts, lang)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Achievements */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm flex items-center gap-2">
          <Award size={16} className="text-champagne" />
          {t(lang, 'achievements')}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((ach, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3 border transition-all ${ach.earned ? 'bg-gradient-to-br from-champagne/15 to-pink-primary/10 border-champagne/30' : 'bg-blush dark:bg-plum-dark/30 border-transparent opacity-50'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {ach.earned ? (
                  <Flame size={16} className="text-champagne fill-champagne" />
                ) : (
                  <Award size={16} className="text-plum/30 dark:text-pink-light/30" />
                )}
                <span className={`text-xs font-extrabold ${ach.earned ? 'text-plum dark:text-pink-light' : 'text-plum/50 dark:text-pink-light/50'}`}>
                  {t(lang, ach.key)}
                </span>
              </div>
              <p className="text-[10px] text-plum/50 dark:text-pink-light/50">{t(lang, ach.desc)}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Reflection note */}
      <Card className="bg-gradient-to-br from-lilac/15 to-pink-primary/5">
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-2 text-sm">{t(lang, 'weeklyReflection')}</h2>
        <p className="text-sm text-plum/70 dark:text-pink-light/70 leading-relaxed">
          {lang === 'ar'
            ? 'كل خطوة صغيرة تقرّبك إلى الله. استمر في الالتزام، وستجد بركة في وقتك وعباداتك. 🌷'
            : 'Every small step brings you closer to Allah. Stay consistent, and you will find blessing in your time and worship. 🌷'}
        </p>
      </Card>
    </div>
  );
}
