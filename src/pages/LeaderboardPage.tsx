import { useEffect, useState, useRef, useCallback } from 'react';
import { Trophy, Crown, Medal, Users, Info, Check, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatNumber, formatShortDate, type TranslationKey } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import type { GroupScore } from '@/hooks/useDailyData';
import { getDateInTimezone, shiftDate } from '@/lib/date';

type GroupInfo = { id: string; name: string; timezone: string };
type Winner = { winner_date: string; user_id: string; points: number; shared_win: boolean };

type MemberProgress = {
  user_id: string;
  username: string;
  display_name: string;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  quran_read: boolean;
  morning_adhkar: boolean;
  evening_adhkar: boolean;
  completed_count: number;
  total_required: number;
  progress_percent: number;
  required_points: number;
  bonus_points: number;
  total_points: number;
  required_activities: number;
};

const ACTIVITY_KEYS: { key: keyof MemberProgress; label: TranslationKey }[] = [
  { key: 'fajr', label: 'fajr' },
  { key: 'dhuhr', label: 'dhuhr' },
  { key: 'asr', label: 'asr' },
  { key: 'maghrib', label: 'maghrib' },
  { key: 'isha', label: 'isha' },
  { key: 'quran_read', label: 'quranReading' },
  { key: 'morning_adhkar', label: 'morningAdhkar' },
  { key: 'evening_adhkar', label: 'eveningAdhkar' },
];

async function getGroupMemberRows(groupId: string): Promise<MemberProgress[]> {
  const { data: memberships } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);

  const userIds = (memberships || []).map(member => member.user_id);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', userIds);

  const profileById = new Map((profiles || []).map(member => [member.id, member]));
  return userIds.map(userId => {
    const member = profileById.get(userId);
    return {
      user_id: userId,
      username: member?.username || '',
      display_name: member?.display_name || '',
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      quran_read: false,
      morning_adhkar: false,
      evening_adhkar: false,
      completed_count: 0,
      total_required: 8,
      progress_percent: 0,
      required_points: 0,
      bonus_points: 0,
      total_points: 0,
      required_activities: 0,
    };
  });
}

export function LeaderboardPage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scores, setScores] = useState<GroupScore[]>([]);
  const [progress, setProgress] = useState<MemberProgress[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupTz, setGroupTz] = useState('UTC');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', profile.id);
      if (!memberships || memberships.length === 0) { setLoading(false); return; }

      const groupIds = memberships.map(m => m.group_id);
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name, timezone')
        .in('id', groupIds);
      setGroups(groupData || []);
      if (groupData && groupData.length > 0) {
        setSelectedGroup(groupData[0].id);
        setGroupTz(groupData[0].timezone || 'UTC');
      }
    })();
  }, [profile]);

  const fetchData = useCallback(async () => {
    if (!selectedGroup || !profile) return;
    const today = getDateInTimezone(groupTz);

    // Finalize yesterday's winner
    void supabase.rpc('finalize_daily_winner', { p_group_id: selectedGroup, p_date: today });

    if (tab === 'daily') {
      const { data: progressData, error: progressError } = await supabase.rpc('get_group_daily_progress', { p_group_id: selectedGroup, p_date: today });
      const memberProgress = progressError
        ? await getGroupMemberRows(selectedGroup)
        : (progressData || []) as MemberProgress[];
      setProgress(memberProgress);

      const { data: scoreData, error: scoreError } = await supabase.rpc('get_group_daily_scores', { p_group_id: selectedGroup, p_date: today });
      setScores(scoreError
        ? memberProgress.map(({ user_id, username, display_name, required_points, bonus_points, total_points, required_activities }) => ({
          user_id, username, display_name, required_points, bonus_points, total_points, required_activities,
        }))
        : (scoreData || []) as GroupScore[]);
    } else {
      setProgress([]);
      const weeklyScores: Record<string, GroupScore> = {};
      const currentGroupDate = getDateInTimezone(groupTz);
      for (let i = 0; i < 7; i++) {
        const tzDate = shiftDate(currentGroupDate, -i);
        const { data } = await supabase.rpc('get_group_daily_scores', { p_group_id: selectedGroup, p_date: tzDate });
        (data || []).forEach((s: GroupScore) => {
          if (!weeklyScores[s.user_id]) {
            weeklyScores[s.user_id] = { ...s, required_points: 0, bonus_points: 0, total_points: 0, required_activities: 0 };
          }
          weeklyScores[s.user_id].required_points += s.required_points;
          weeklyScores[s.user_id].bonus_points += s.bonus_points;
          weeklyScores[s.user_id].total_points += s.total_points;
          weeklyScores[s.user_id].required_activities += s.required_activities;
        });
      }
      const weeklyData = Object.values(weeklyScores);
      setScores(weeklyData.length > 0 ? weeklyData : await getGroupMemberRows(selectedGroup).then(members => members.map(({ user_id, username, display_name, required_points, bonus_points, total_points, required_activities }) => ({
        user_id, username, display_name, required_points, bonus_points, total_points, required_activities,
      }))));
    }

    const { data: winnersData } = await supabase
      .from('daily_winners')
      .select('winner_date, user_id, points, shared_win')
      .eq('group_id', selectedGroup)
      .order('winner_date', { ascending: false })
      .limit(10);
    setWinners((winnersData || []) as Winner[]);
  }, [selectedGroup, profile, tab, groupTz]);

  useEffect(() => {
    if (!selectedGroup) return;
    setLoading(true);
    fetchData().then(() => setLoading(false));
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { fetchData(); }, 10000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedGroup, tab, fetchData]);

  useEffect(() => {
    const g = groups.find(g => g.id === selectedGroup);
    if (g) setGroupTz(g.timezone || 'UTC');
  }, [selectedGroup, groups]);

  const sortedProgress = [...progress].sort((a, b) => b.total_points - a.total_points || b.required_activities - a.required_activities || b.completed_count - a.completed_count);
  const sortedScores = [...scores].sort((a, b) => b.total_points - a.total_points || b.required_activities - a.required_activities);
  const todayWinner = tab === 'daily' ? sortedProgress[0] : sortedScores[0];
  const allZero = tab === 'daily'
    ? sortedProgress.length > 0 && sortedProgress.every(s => s.total_points === 0)
    : sortedScores.length > 0 && sortedScores.every(s => s.total_points === 0);

  if (groups.length === 0 && !loading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="text-center pt-2">
          <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'leaderboard')}</h1>
        </div>
        <Card className="text-center py-10">
          <Users size={40} className="text-pink-primary/30 mx-auto mb-3" />
          <p className="text-plum/50 dark:text-pink-light/50 mb-4">{t(lang, 'noGroup')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <Trophy size={28} className="text-champagne mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'leaderboard')}</h1>
      </div>

      {/* Group selector */}
      {groups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedGroup === g.id ? 'bg-rose text-white' : 'bg-card dark:bg-plum text-plum/60 dark:text-pink-light/60 border border-pink-primary/10'}`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-card dark:bg-plum rounded-2xl p-1.5 border border-pink-primary/10">
        <button
          onClick={() => setTab('daily')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'daily' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'text-plum/60 dark:text-pink-light/60'}`}
        >
          {t(lang, 'dailyLeaderboard')}
        </button>
        <button
          onClick={() => setTab('weekly')}
          className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'weekly' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'text-plum/60 dark:text-pink-light/60'}`}
        >
          {t(lang, 'weeklyLeaderboard')}
        </button>
      </div>

      {/* Today's leader card */}
      {todayWinner && todayWinner.total_points > 0 && (
        <Card className="bg-gradient-to-br from-champagne/15 to-pink-primary/10 border-champagne/20 text-center py-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-champagne to-champagne-dark flex items-center justify-center mx-auto mb-3 animate-float">
            <Crown size={32} className="text-white" />
          </div>
          <p className="text-xs text-rose font-bold mb-1">{t(lang, 'currentLeader')}</p>
          <p className="text-lg font-extrabold text-plum dark:text-pink-light">{todayWinner.display_name || '—'}</p>
          <p className="text-sm text-rose font-bold">{formatNumber(todayWinner.total_points, lang)} {t(lang, 'points')}</p>
        </Card>
      )}

      {/* Zero-point fresh start message */}
      {allZero && !loading && (
        <Card className="text-center py-6 bg-gradient-to-br from-pink-primary/10 to-lilac/15 border-pink-primary/20">
          <p className="text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'freshStart')}</p>
        </Card>
      )}

      {/* Scores / Progress */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'daily' ? (
        sortedProgress.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-plum/50 dark:text-pink-light/50">{t(lang, 'noData')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedProgress.map((m, i) => {
              const isTop = i === 0 && m.total_points > 0;
              const isMe = m.user_id === profile?.id;
              const isExpanded = expandedMember === m.user_id;
              return (
                <Card key={m.user_id} className={`overflow-hidden ${isMe ? 'border-rose/30 bg-rose/5' : ''}`}>
                  <button
                    onClick={() => setExpandedMember(isExpanded ? null : m.user_id)}
                    className="w-full flex items-center gap-3 text-start"
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${isTop ? 'bg-gradient-to-br from-champagne to-champagne-dark text-white' : i === 1 && m.total_points > 0 ? 'bg-gradient-to-br from-plum/30 to-plum/20 text-plum dark:text-pink-light' : i === 2 && m.total_points > 0 ? 'bg-gradient-to-br from-champagne/30 to-champagne/20 text-champagne' : 'bg-blush dark:bg-plum-dark/40 text-plum/50 dark:text-pink-light/50'}`}>
                      {isTop ? <Crown size={16} className="fill-white" /> : formatNumber(i + 1, lang)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-plum dark:text-pink-light text-sm truncate">{m.display_name || '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-blush dark:bg-plum-dark/40 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-pink-primary to-rose rounded-full transition-all duration-700"
                            style={{ width: `${m.progress_percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-plum/60 dark:text-pink-light/60 flex-shrink-0 whitespace-nowrap">
                          {formatNumber(m.completed_count, lang)}/{formatNumber(m.total_required, lang)} {t(lang, 'completedVsTotal')}
                        </span>
                      </div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="font-extrabold text-rose">{formatNumber(m.total_points, lang)}</p>
                      <p className="text-[10px] text-plum/40 dark:text-pink-light/40">{formatNumber(m.required_points, lang)} + {formatNumber(m.bonus_points, lang)}</p>
                    </div>
                  </button>

                  {/* Expanded activity breakdown */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-pink-primary/10 grid grid-cols-2 gap-2 animate-fade-in">
                      {ACTIVITY_KEYS.map(({ key, label }) => {
                        const done = m[key] as boolean;
                        return (
                          <div key={key} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl ${done ? 'bg-green-500/10' : 'bg-blush dark:bg-plum-dark/30'}`}>
                            {done ? (
                              <Check size={14} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <Circle size={14} className="text-plum/30 dark:text-pink-light/30 flex-shrink-0" />
                            )}
                            <span className={`text-xs font-bold ${done ? 'text-plum dark:text-pink-light' : 'text-plum/40 dark:text-pink-light/40'}`}>
                              {t(lang, label)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        sortedScores.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-plum/50 dark:text-pink-light/50">{t(lang, 'noData')}</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {sortedScores.map((s, i) => {
              const isTop = i === 0 && s.total_points > 0;
              const isMe = s.user_id === profile?.id;
              return (
                <Card key={s.user_id} className={`flex items-center gap-3 ${isMe ? 'border-rose/30 bg-rose/5' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm flex-shrink-0 ${isTop ? 'bg-gradient-to-br from-champagne to-champagne-dark text-white' : i === 1 && s.total_points > 0 ? 'bg-gradient-to-br from-plum/30 to-plum/20 text-plum dark:text-pink-light' : i === 2 && s.total_points > 0 ? 'bg-gradient-to-br from-champagne/30 to-champagne/20 text-champagne' : 'bg-blush dark:bg-plum-dark/40 text-plum/50 dark:text-pink-light/50'}`}>
                    {isTop ? <Crown size={16} className="fill-white" /> : formatNumber(i + 1, lang)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-plum dark:text-pink-light text-sm truncate">{s.display_name || '—'}</p>
                    <p className="text-xs text-plum/50 dark:text-pink-light/50">{formatNumber(s.required_activities, lang)} {t(lang, 'activities')}</p>
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="font-extrabold text-rose">{formatNumber(s.total_points, lang)}</p>
                    <p className="text-[10px] text-plum/40 dark:text-pink-light/40">{formatNumber(s.required_points, lang)} + {formatNumber(s.bonus_points, lang)}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* Historical winners */}
      {tab === 'daily' && (
        <Card>
          <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm flex items-center gap-2">
            <Medal size={16} className="text-champagne" />
            {t(lang, 'historicalWinners')}
          </h2>
          {winners.length === 0 ? (
            <p className="text-sm text-plum/40 dark:text-pink-light/40 text-center py-4">{t(lang, 'noWinnersYet')}</p>
          ) : (
            <div className="space-y-2">
              {winners.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-blush dark:bg-plum-dark/30">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-champagne" />
                    <div>
                      <p className="font-bold text-plum dark:text-pink-light text-sm">{progress.find(s => s.user_id === w.user_id)?.display_name || scores.find(s => s.user_id === w.user_id)?.display_name || '—'}</p>
                      <p className="text-xs text-plum/50 dark:text-pink-light/50">{formatShortDate(new Date(w.winner_date), lang)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {w.shared_win && <span className="text-xs bg-lilac/30 text-lilac-dark font-bold px-2 py-0.5 rounded-full">{t(lang, 'sharedWin')}</span>}
                    <span className="font-extrabold text-rose text-sm">{formatNumber(w.points, lang)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-lilac/15 dark:bg-lilac/10 rounded-2xl p-3">
        <Info size={16} className="text-lilac-dark flex-shrink-0 mt-0.5" />
        <p className="text-xs text-plum/60 dark:text-pink-light/60">{t(lang, 'pointsDisclaimer')}</p>
      </div>
    </div>
  );
}
