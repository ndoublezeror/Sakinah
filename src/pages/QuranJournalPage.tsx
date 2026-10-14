import { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, BookMarked } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatShortDate } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useDailyData, type QuranEntry } from '@/hooks/useDailyData';

export function QuranJournalPage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const { log, logDate, updateLog } = useDailyData();
  const [entries, setEntries] = useState<QuranEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<QuranEntry | null>(null);
  const [surah, setSurah] = useState('');
  const [ayahRange, setAyahRange] = useState('');
  const [reflection, setReflection] = useState('');

  const fetchEntries = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('quran_journal')
      .select('*')
      .eq('user_id', profile.id)
      .order('log_date', { ascending: false })
      .limit(30);
    setEntries((data || []) as QuranEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    const entryData = { surah: surah || null, ayah_range: ayahRange || null, reflection: reflection || null };

    if (editing) {
      await supabase.from('quran_journal').update(entryData).eq('id', editing.id);
    } else {
      await supabase.from('quran_journal').insert({ user_id: profile.id, log_date: logDate, ...entryData });
      // Mark quran_read as true in daily log
      if (!log?.quran_read) {
        await updateLog({ quran_read: true });
      }
    }

    setSurah(''); setAyahRange(''); setReflection('');
    setEditing(null); setShowForm(false);
    fetchEntries();
  };

  const handleEdit = (entry: QuranEntry) => {
    setEditing(entry);
    setSurah(entry.surah || '');
    setAyahRange(entry.ayah_range || '');
    setReflection(entry.reflection || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('quran_journal').delete().eq('id', id);
    fetchEntries();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 mb-2">
          <BookOpen size={28} className="text-rose" />
          <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'quranJournal')}</h1>
        </div>
        <p className="text-sm text-plum/60 dark:text-pink-light/60">{t(lang, 'tagline')}</p>
      </div>

      {/* Quick toggle */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${log?.quran_read ? 'bg-gradient-to-br from-pink-primary to-rose' : 'bg-blush dark:bg-plum-dark/40'}`}>
            <BookMarked size={20} className={log?.quran_read ? 'text-white' : 'text-pink-primary/40'} />
          </div>
          <div>
            <p className="font-bold text-plum dark:text-pink-light text-sm">{t(lang, 'quranReadToday')}</p>
            <p className="text-xs text-plum/50 dark:text-pink-light/50">1 {t(lang, 'point')}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={log?.quran_read ? 'outline' : 'primary'}
          onClick={() => updateLog({ quran_read: !log?.quran_read })}
        >
          {log?.quran_read ? t(lang, 'markIncomplete') : t(lang, 'markComplete')}
        </Button>
      </Card>

      {/* Add entry button */}
      <Button fullWidth variant="secondary" onClick={() => { setEditing(null); setSurah(''); setAyahRange(''); setReflection(''); setShowForm(true); }}>
        <Plus size={18} /> {t(lang, 'addEntry')}
      </Button>

      {/* Entries */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <Card className="text-center py-10">
          <BookOpen size={40} className="text-pink-primary/30 mx-auto mb-3" />
          <p className="text-plum/50 dark:text-pink-light/50">{t(lang, 'noEntries')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <Card key={entry.id} className="animate-slide-up">
              <div className="flex items-start justify-between mb-2">
                <div>
                  {entry.surah && (
                    <p className="font-extrabold text-rose text-sm">{entry.surah} {entry.ayah_range && `· ${entry.ayah_range}`}</p>
                  )}
                  <p className="text-xs text-plum/50 dark:text-pink-light/50">{formatShortDate(new Date(entry.log_date), lang)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(entry)} className="p-1.5 rounded-lg hover:bg-pink-primary/10 text-plum/60 dark:text-pink-light/60 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {entry.reflection && (
                <p className="text-sm text-plum/70 dark:text-pink-light/70 leading-relaxed">{entry.reflection}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Form modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? t(lang, 'editEntry') : t(lang, 'addEntry')}>
        <div className="space-y-4">
          <Input label={t(lang, 'surah')} value={surah} onChange={e => setSurah(e.target.value)} placeholder={lang === 'ar' ? 'مثال: البقرة' : 'e.g. Al-Baqarah'} />
          <Input label={t(lang, 'ayahRange')} value={ayahRange} onChange={e => setAyahRange(e.target.value)} placeholder="1-10" />
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'reflection')}</label>
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              rows={4}
              className="w-full bg-blush dark:bg-plum-dark/50 border-2 border-pink-primary/20 focus:border-pink-primary rounded-2xl px-4 py-3 text-plum dark:text-pink-light placeholder:text-plum/40 dark:placeholder:text-pink-light/40 outline-none transition-all resize-none"
              placeholder={lang === 'ar' ? 'ماذا تعلمت اليوم؟' : 'What did you learn today?'}
            />
          </div>
          <Button fullWidth onClick={handleSave}>{t(lang, 'saveEntry')}</Button>
        </div>
      </Modal>
    </div>
  );
}
