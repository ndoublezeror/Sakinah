import { useEffect, useState } from 'react';
import { Search, Heart, Bookmark, Plus, Info, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t, formatDate, type TranslationKey } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';

type Contribution = {
  id: string;
  user_id: string;
  title: string;
  category: string;
  explanation: string;
  source: string | null;
  language: string;
  status: string;
  created_at: string;
};

type Profile = { id: string; username: string; display_name: string };

const categoryKeys: Record<string, TranslationKey> = {
  quran: 'catQuran', hadith: 'catHadith', fiqh: 'catFiqh', tafsir: 'catTafsir',
  seerah: 'catSeerah', dua: 'catDua', adhkar: 'catAdhkar', other: 'catOther',
};

export function KnowledgePage() {
  const { profile } = useAuth();
  const { lang } = useI18n();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('quran');
  const [explanation, setExplanation] = useState('');
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});

  const categories = Object.keys(categoryKeys);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('knowledge_contributions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setContributions((data || []) as Contribution[]);

    // Fetch bookmarks
    if (profile) {
      const { data: bmData } = await supabase
        .from('knowledge_bookmarks')
        .select('contribution_id')
        .eq('user_id', profile.id);
      setBookmarks(new Set((bmData || []).map(b => b.contribution_id)));
    }

    // Fetch profiles for attribution
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);
      const map: Record<string, Profile> = {};
      (profiles || []).forEach(p => { map[p.id] = p; });
      setProfileMap(map);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [profile]);

  const handlePublish = async () => {
    if (!profile) return;
    setError(null);
    if (title.trim().length < 3) { setError(lang === 'ar' ? 'العنوان قصير جداً' : 'Title too short'); return; }
    if (explanation.trim().length < 10) { setError(lang === 'ar' ? 'الشرح قصير جداً' : 'Explanation too short'); return; }

    const { error: err } = await supabase
      .from('knowledge_contributions')
      .insert({
        user_id: profile.id,
        title: title.trim(),
        category,
        explanation: explanation.trim(),
        source: source.trim() || null,
        language: lang,
      });

    if (err) { setError(err.message); return; }

    setTitle(''); setExplanation(''); setSource(''); setCategory('quran');
    setShowForm(false);
    fetchData();
  };

  const toggleBookmark = async (contributionId: string) => {
    if (!profile) return;
    if (bookmarks.has(contributionId)) {
      await supabase.from('knowledge_bookmarks').delete().eq('user_id', profile.id).eq('contribution_id', contributionId);
      setBookmarks(prev => { const n = new Set(prev); n.delete(contributionId); return n; });
    } else {
      await supabase.from('knowledge_bookmarks').insert({ user_id: profile.id, contribution_id: contributionId });
      setBookmarks(prev => new Set(prev).add(contributionId));
    }
  };

  const filtered = contributions.filter(c => {
    if (showBookmarksOnly && !bookmarks.has(c.id)) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.explanation.toLowerCase().includes(q);
    }
    return true;
  });

  const todayContribution = contributions[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 mb-2">
          <Heart size={28} className="text-rose fill-rose/20" />
          <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'todaysKnowledge')}</h1>
        </div>
      </div>

      {/* Featured card */}
      {todayContribution && (
        <Card className="bg-gradient-to-br from-pink-primary/10 via-lilac/10 to-champagne/5 border-pink-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs bg-rose/20 text-rose font-bold px-3 py-1 rounded-full">{t(lang, 'todaysKnowledge')}</span>
            <span className="text-xs bg-pink-primary/15 text-rose font-bold px-3 py-1 rounded-full">{t(lang, categoryKeys[todayContribution.category] || 'catOther')}</span>
          </div>
          <h2 className="text-lg font-extrabold text-plum dark:text-pink-light mb-2">{todayContribution.title}</h2>
          <p className="text-sm text-plum/70 dark:text-pink-light/70 leading-relaxed mb-3">{todayContribution.explanation}</p>
          {todayContribution.source && (
            <p className="text-xs text-plum/50 dark:text-pink-light/50 italic mb-2">📖 {todayContribution.source}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-plum/50 dark:text-pink-light/50">
              {t(lang, 'byAuthor')} {profileMap[todayContribution.user_id]?.display_name || '—'} · {formatDate(new Date(todayContribution.created_at), lang)}
            </p>
            <button onClick={() => toggleBookmark(todayContribution.id)} className="p-2 rounded-xl hover:bg-pink-primary/10 transition-colors">
              <Bookmark size={18} className={bookmarks.has(todayContribution.id) ? 'fill-rose text-rose' : 'text-plum/40 dark:text-pink-light/40'} />
            </button>
          </div>
        </Card>
      )}

      {/* Share button */}
      <Button fullWidth variant="secondary" onClick={() => setShowForm(true)}>
        <Plus size={18} /> {t(lang, 'shareKnowledge')}
      </Button>

      {/* Moderation note */}
      <div className="flex items-start gap-2 bg-lilac/15 dark:bg-lilac/10 rounded-2xl p-3">
        <Info size={16} className="text-lilac-dark flex-shrink-0 mt-0.5" />
        <p className="text-xs text-plum/60 dark:text-pink-light/60">{t(lang, 'moderationNote')}</p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t(lang, 'searchKnowledge')}
          icon={<Search size={18} />}
        />
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === 'all' ? 'bg-rose text-white' : 'bg-card dark:bg-plum text-plum/60 dark:text-pink-light/60 border border-pink-primary/10'}`}
          >
            {t(lang, 'allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${categoryFilter === cat ? 'bg-rose text-white' : 'bg-card dark:bg-plum text-plum/60 dark:text-pink-light/60 border border-pink-primary/10'}`}
            >
              {t(lang, categoryKeys[cat])}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${showBookmarksOnly ? 'bg-rose text-white' : 'bg-card dark:bg-plum text-plum/60 dark:text-pink-light/60 border border-pink-primary/10'}`}
        >
          <Bookmark size={16} /> {t(lang, 'myBookmarks')}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-10">
          <BookOpen size={40} className="text-pink-primary/30 mx-auto mb-3" />
          <p className="text-plum/50 dark:text-pink-light/50">{t(lang, 'noKnowledgeYet')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Card key={c.id} className="animate-slide-up">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-pink-primary/15 text-rose font-bold px-2 py-0.5 rounded-full">{t(lang, categoryKeys[c.category] || 'catOther')}</span>
                    {c.language === 'ar' && <span className="text-xs bg-lilac/30 text-lilac-dark font-bold px-2 py-0.5 rounded-full">ع</span>}
                  </div>
                  <h3 className="font-extrabold text-plum dark:text-pink-light text-sm">{c.title}</h3>
                </div>
                <button onClick={() => toggleBookmark(c.id)} className="p-1.5 rounded-lg hover:bg-pink-primary/10 transition-colors flex-shrink-0">
                  <Bookmark size={16} className={bookmarks.has(c.id) ? 'fill-rose text-rose' : 'text-plum/40 dark:text-pink-light/40'} />
                </button>
              </div>
              <p className="text-sm text-plum/70 dark:text-pink-light/70 leading-relaxed line-clamp-3">{c.explanation}</p>
              {c.source && <p className="text-xs text-plum/40 dark:text-pink-light/40 italic mt-2">📖 {c.source}</p>}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-pink-primary/10">
                <p className="text-xs text-plum/50 dark:text-pink-light/50">
                  {t(lang, 'byAuthor')} {profileMap[c.user_id]?.display_name || '—'}
                </p>
                {c.user_id === profile?.id && (
                  <span className="text-xs text-plum/40 dark:text-pink-light/40">{t(lang, 'communityContribution')}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Submit modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={t(lang, 'shareKnowledge')} maxWidth="max-w-lg">
        <div className="space-y-4">
          <Input label={t(lang, 'knowledgeTitle')} value={title} onChange={e => setTitle(e.target.value)} placeholder={lang === 'ar' ? 'عنوان المعلومة' : 'Knowledge title'} />
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'knowledgeCategory')}</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-blush dark:bg-plum-dark/50 border-2 border-pink-primary/20 focus:border-pink-primary rounded-2xl px-4 py-3 text-plum dark:text-pink-light outline-none transition-all"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{t(lang, categoryKeys[cat])}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'knowledgeExplanation')}</label>
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              rows={5}
              className="w-full bg-blush dark:bg-plum-dark/50 border-2 border-pink-primary/20 focus:border-pink-primary rounded-2xl px-4 py-3 text-plum dark:text-pink-light placeholder:text-plum/40 dark:placeholder:text-pink-light/40 outline-none transition-all resize-none"
              placeholder={lang === 'ar' ? 'اكتب الشرح هنا...' : 'Write your explanation here...'}
            />
          </div>
          <Input label={t(lang, 'knowledgeSource')} value={source} onChange={e => setSource(e.target.value)} placeholder={lang === 'ar' ? 'المصدر (اختياري)' : 'Source (optional)'} />
          {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setShowForm(false)}>{t(lang, 'cancel')}</Button>
            <Button fullWidth onClick={handlePublish}>{t(lang, 'publish')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
