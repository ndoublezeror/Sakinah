import { useEffect, useState } from 'react';
import { Users, Plus, Copy, Check, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';

type Group = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
};

export function GroupsPage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!profile) return;
    setLoading(true);
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', profile.id);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map(m => m.group_id);
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds);
    setGroups(groupData || []);

    // Get member counts
    const counts: Record<string, number> = {};
    for (const gid of groupIds) {
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', gid);
      counts[gid] = count || 0;
    }
    setMemberCounts(counts);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [profile]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!profile) return;
    setError(null);
    if (groupName.trim().length < 2) { setError(lang === 'ar' ? 'الاسم قصير جداً' : 'Name too short'); return; }

    const code = generateInviteCode();
    const { data, error: err } = await supabase
      .from('groups')
      .insert({
        name: groupName.trim(),
        description: groupDesc.trim() || null,
        invite_code: code,
        created_by: profile.id,
      })
      .select()
      .single();

    if (err) { setError(err.message); return; }

    // Join the group as creator
    await supabase.from('group_members').insert({ group_id: data.id, user_id: profile.id });

    setGroupName(''); setGroupDesc('');
    setShowCreate(false);
    fetchGroups();
  };

  const handleJoin = async () => {
    if (!profile) return;
    setError(null);
    if (!joinCode.trim()) { setError(t(lang, 'invalidCode')); return; }

    const { data: group } = await supabase
      .from('groups')
      .select('id')
      .eq('invite_code', joinCode.trim().toUpperCase())
      .maybeSingle();

    if (!group) { setError(t(lang, 'invalidCode')); return; }

    const { error: err } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: profile.id });

    if (err) {
      if (err.code === '23505') { setError(lang === 'ar' ? 'أنت عضو بالفعل' : 'Already a member'); return; }
      setError(err.message); return;
    }

    setJoinCode('');
    setShowJoin(false);
    fetchGroups();
  };

  const handleLeave = async (groupId: string) => {
    if (!profile) return;
    await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', profile.id);
    fetchGroups();
  };

  const copyCode = (code: string, gid: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(gid);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <Users size={28} className="text-rose mx-auto mb-2" />
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'groups')}</h1>
      </div>

      <div className="flex gap-2">
        <Button fullWidth variant="primary" onClick={() => setShowCreate(true)}>
          <Plus size={18} /> {t(lang, 'createGroup')}
        </Button>
        <Button fullWidth variant="outline" onClick={() => setShowJoin(true)}>
          <Search size={18} /> {t(lang, 'joinGroup')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-10">
          <Users size={40} className="text-pink-primary/30 mx-auto mb-3" />
          <p className="text-plum/50 dark:text-pink-light/50">{t(lang, 'noGroups')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <Card key={g.id} className="animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-plum dark:text-pink-light">{g.name}</h3>
                  {g.description && <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-0.5">{g.description}</p>}
                </div>
                <span className="text-xs text-plum/50 dark:text-pink-light/50 bg-blush dark:bg-plum-dark/40 px-2 py-1 rounded-full font-bold flex-shrink-0">
                  {memberCounts[g.id] || 0} {t(lang, memberCounts[g.id] === 1 ? 'member_s' : 'members')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-primary/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-plum/50 dark:text-pink-light/50 font-bold">{t(lang, 'inviteCode')}:</span>
                  <code className="text-sm font-extrabold text-rose bg-pink-primary/10 px-2 py-0.5 rounded-lg">{g.invite_code}</code>
                  <button onClick={() => copyCode(g.invite_code, g.id)} className="p-1.5 rounded-lg hover:bg-pink-primary/10 transition-colors">
                    {copiedId === g.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-plum/60 dark:text-pink-light/60" />}
                  </button>
                  {copiedId === g.id && <span className="text-xs text-green-500 font-bold">{t(lang, 'copied')}</span>}
                </div>
                <button onClick={() => handleLeave(g.id)} className="flex items-center gap-1 text-xs font-bold text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-lg transition-colors">
                  <LogOut size={14} /> {t(lang, 'leaveGroup')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t(lang, 'createGroup')}>
        <div className="space-y-4">
          <Input label={t(lang, 'groupName')} value={groupName} onChange={e => setGroupName(e.target.value)} placeholder={lang === 'ar' ? 'اسم المجموعة' : 'Group name'} />
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'groupDescription')}</label>
            <textarea
              value={groupDesc}
              onChange={e => setGroupDesc(e.target.value)}
              rows={3}
              className="w-full bg-blush dark:bg-plum-dark/50 border-2 border-pink-primary/20 focus:border-pink-primary rounded-2xl px-4 py-3 text-plum dark:text-pink-light placeholder:text-plum/40 dark:placeholder:text-pink-light/40 outline-none transition-all resize-none"
              placeholder={lang === 'ar' ? 'وصف المجموعة' : 'Group description'}
            />
          </div>
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <Button fullWidth onClick={handleCreate}>{t(lang, 'createGroup')}</Button>
        </div>
      </Modal>

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title={t(lang, 'joinGroup')}>
        <div className="space-y-4">
          <Input label={t(lang, 'inviteCode')} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" className="uppercase tracking-wider text-center font-extrabold text-lg" />
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <Button fullWidth onClick={handleJoin}>{t(lang, 'joinWithCode')}</Button>
        </div>
      </Modal>
    </div>
  );
}
