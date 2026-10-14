import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Circle, Sunrise, Sunset, BookOpen, Heart, Trophy, Flame, Sparkles, ArrowRight, Users, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatDate, formatNumber } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { supabase } from '@/lib/supabase';
import { useDailyData, type GroupScore, type KnowledgeContribution } from '@/hooks/useDailyData';
import { useReminder } from '@/hooks/useReminder';
import { shiftDate } from '@/lib/date';

export function DashboardPage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { log, logDate, points } = useDailyData();
  const reminder = useReminder();
  const [groupScores, setGroupScores] = useState<GroupScore[]>([]);
  const [todayKnowledge, setTodayKnowledge] = useState<KnowledgeContribution | null>(null);
  const [streak, setStreak] = useState(0);

  const prayers = [
    { key: 'fajr', label: t(lang, 'fajr') },
    { key: 'dhuhr', label: t(lang, 'dhuhr') },
    { key: 'asr', label: t(lang, 'asr') },
    { key: 'maghrib', label: t(lang, 'maghrib') },
    { key: 'isha', label: t(lang, 'isha') },
  ] as const;

  useEffect(() => {
    if (!profile) return;
    // Fetch today's featured knowledge
    supabase
      .from('knowledge_contributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setTodayKnowledge(data as KnowledgeContribution | null));

    // Fetch streak (consecutive days with at least 1 prayer)
    (async () => {
      const { data } = await supabase
        .from('daily_logs')
        .select('log_date, fajr, dhuhr, asr, maghrib, isha')
        .eq('user_id', profile.id)
        .order('log_date', { ascending: false })
        .limit(30);
      if (!data) return;
      let count = 0;
      for (let i = 0; i < 30; i++) {
        const dateStr = shiftDate(logDate, -i);
        const entry = data.find(d => d.log_date === dateStr);
        if (entry && (entry.fajr || entry.dhuhr || entry.asr || entry.maghrib || entry.isha)) {
          count++;
        } else if (i > 0) {
          break;
        }
      }
      setStreak(count);
    })();

    // Fetch group scores for current leader
    (async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', profile.id);
      if (!memberships || memberships.length === 0) return;
      const { data: scores } = await supabase
        .rpc('get_group_daily_scores', { p_group_id: memberships[0].group_id, p_date: logDate });
      if (scores) setGroupScores(scores as GroupScore[]);
    })();
  }, [profile, logDate]);

  const requiredPct = points ? (points.required_points / points.max_required) * 100 : 0;
  const currentLeader = groupScores.sort((a, b) => b.total_points - a.total_points)[0];

  const quickActions = [
    { to: '/tracker', icon: Heart, label: t(lang, 'tracker') },
    { to: '/tasbih', icon: Sparkles, label: t(lang, 'tasbih') },
    { to: '/quran', icon: BookOpen, label: t(lang, 'quranJournal') },
    { to: '/knowledge', icon: Users, label: t(lang, 'knowledge') },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greeting */}
      <div className="text-center pt-2">
        <h1 className="text-2xl md:text-3xl font-extrabold text-plum dark:text-pink-light">
          {t(lang, 'assalamuAlaikum')}
        </h1>
        <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-1 font-semibold italic">{t(lang, 'tagline')}</p>
        <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-2">{formatDate(new Date(), lang)}</p>
      </div>

      {/* In-app reminder banner */}
      {reminder.shouldShowInApp && (
        <Card className="bg-gradient-to-r from-pink-primary/15 to-lilac/25 border-pink-primary/30 animate-pop-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-primary to-rose flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-white fill-white/30" />
            </div>
            <p className="flex-1 font-extrabold text-plum dark:text-pink-light text-sm">
              {t(lang, 'reminderMessage')}
            </p>
            <button onClick={reminder.dismissInApp} className="p-1.5 rounded-lg hover:bg-pink-primary/15 text-plum/50 dark:text-pink-light/50 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </Card>
      )}

      {/* Progress ring + points summary */}
      <Card className="flex flex-col items-center py-6">
        <ProgressRing
          percentage={requiredPct}
          size={180}
          label={points ? `${formatNumber(points.required_points, lang)}/${formatNumber(points.max_required, lang)}` : `${formatNumber(0, lang)}/${formatNumber(20, lang)}`}
          sublabel={t(lang, 'requiredPoints')}
        />
        <div className="grid grid-cols-3 gap-4 mt-6 w-full max-w-sm">
          <div className="text-center">
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'requiredPoints')}</p>
            <p className="text-lg font-extrabold text-rose">{points ? formatNumber(points.required_points, lang) : 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'bonusPoints')}</p>
            <p className="text-lg font-extrabold text-champagne">{points ? formatNumber(points.bonus_points, lang) : 0}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'totalDailyPoints')}</p>
            <p className="text-lg font-extrabold text-plum dark:text-pink-light">{points ? formatNumber(points.total_points, lang) : 0}</p>
          </div>
        </div>
        {points && points.required_points < points.max_required && (
          <p className="text-xs text-plum/50 dark:text-pink-light/50 mt-3">
            {t(lang, 'remainingRequired')}: {formatNumber(points.max_required - points.required_points, lang)}
          </p>
        )}
      </Card>

      {/* Prayer checklist */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3">{t(lang, 'prayerChecklist')}</h2>
        <div className="grid grid-cols-5 gap-2">
          {prayers.map(p => {
            const done = log?.[p.key] ?? false;
            return (
              <div key={p.key} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${done ? 'bg-gradient-to-br from-pink-primary to-rose animate-check-pop' : 'bg-blush dark:bg-plum-dark/40'}`}>
                  {done ? <Check size={18} className="text-white" /> : <Circle size={16} className="text-pink-primary/40" />}
                </div>
                <span className={`text-[10px] font-bold ${done ? 'text-rose' : 'text-plum/50 dark:text-pink-light/50'}`}>{p.label}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Adhkar + Quran row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${log?.morning_adhkar ? 'bg-champagne/20' : 'bg-blush dark:bg-plum-dark/40'}`}>
            <Sunrise size={20} className={log?.morning_adhkar ? 'text-champagne' : 'text-pink-primary/40'} />
          </div>
          <div>
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'morningAdhkar')}</p>
            <p className={`text-sm font-bold ${log?.morning_adhkar ? 'text-rose' : 'text-plum/40 dark:text-pink-light/40'}`}>
              {log?.morning_adhkar ? t(lang, 'completed') : t(lang, 'notCompleted')}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${log?.evening_adhkar ? 'bg-champagne/20' : 'bg-blush dark:bg-plum-dark/40'}`}>
            <Sunset size={20} className={log?.evening_adhkar ? 'text-champagne' : 'text-pink-primary/40'} />
          </div>
          <div>
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'eveningAdhkar')}</p>
            <p className={`text-sm font-bold ${log?.evening_adhkar ? 'text-rose' : 'text-plum/40 dark:text-pink-light/40'}`}>
              {log?.evening_adhkar ? t(lang, 'completed') : t(lang, 'notCompleted')}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${log?.quran_read ? 'bg-lilac' : 'bg-blush dark:bg-plum-dark/40'}`}>
            <BookOpen size={20} className={log?.quran_read ? 'text-rose' : 'text-pink-primary/40'} />
          </div>
          <div>
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'quranReading')}</p>
            <p className={`text-sm font-bold ${log?.quran_read ? 'text-rose' : 'text-plum/40 dark:text-pink-light/40'}`}>
              {log?.quran_read ? t(lang, 'completed') : t(lang, 'notCompleted')}
            </p>
          </div>
        </Card>
      </div>

      {/* Streak + Current leader */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-300 to-rose flex items-center justify-center">
            <Flame size={24} className="text-white" />
          </div>
          <div>
            <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'streak')}</p>
            <p className="text-xl font-extrabold text-rose">{formatNumber(streak, lang)} {t(lang, 'days')}</p>
          </div>
        </Card>
        {currentLeader ? (
          <Card className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-champagne to-champagne-dark flex items-center justify-center">
              <Trophy size={24} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'currentLeader')}</p>
              <p className="text-sm font-extrabold text-rose truncate">{currentLeader.display_name}</p>
              <p className="text-xs text-plum/50 dark:text-pink-light/50">{formatNumber(currentLeader.total_points, lang)} {t(lang, 'points')}</p>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-lilac flex items-center justify-center">
              <Users size={24} className="text-plum/50" />
            </div>
            <div>
              <p className="text-xs text-plum/60 dark:text-pink-light/60 font-semibold">{t(lang, 'currentLeader')}</p>
              <p className="text-sm font-bold text-plum/50 dark:text-pink-light/50">{t(lang, 'noGroupYet')}</p>
            </div>
          </Card>
        )}
      </div>

      {/* Today's knowledge */}
      {todayKnowledge && (
        <Card className="bg-gradient-to-br from-pink-primary/5 to-lilac/10" onClick={() => navigate('/knowledge')}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-primary to-rose flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-rose font-bold mb-1">{t(lang, 'todaysKnowledge')}</p>
              <h3 className="font-extrabold text-plum dark:text-pink-light mb-1 truncate">{todayKnowledge.title}</h3>
              <p className="text-sm text-plum/60 dark:text-pink-light/60 line-clamp-2">{todayKnowledge.explanation}</p>
            </div>
            <ArrowRight size={18} className="text-pink-primary/40 flex-shrink-0 mt-1 rtl:rotate-180" />
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm">{t(lang, 'quickActions')}</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(action.to)}
                className="flex flex-col items-center gap-1.5 bg-card dark:bg-plum rounded-2xl p-3 card-shadow border border-pink-primary/10 hover:shadow-lg active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-primary/15 to-lilac flex items-center justify-center">
                  <Icon size={18} className="text-rose" />
                </div>
                <span className="text-[10px] font-bold text-plum dark:text-pink-light text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
