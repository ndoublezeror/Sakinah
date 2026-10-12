import { useNavigate } from 'react-router-dom';
import { Moon, Star, Heart, Sparkles, BookOpen, Users, Trophy } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { InstallButton } from '@/components/ui/InstallButton';
import { useEffect } from 'react';

export function LandingPage() {
  const { lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blush via-blush-dark to-lilac-light islamic-pattern dark:from-plum-dark dark:via-plum-dark dark:to-plum flex items-center justify-center">
        <span className="w-8 h-8 border-3 border-pink-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    { icon: Heart, titleKey: 'tracker' as const, descKey: 'tagline' as const },
    { icon: BookOpen, titleKey: 'quranJournal' as const, descKey: 'quranReading' as const },
    { icon: Sparkles, titleKey: 'tasbih' as const, descKey: 'tasbihCounter' as const },
    { icon: Users, titleKey: 'groups' as const, descKey: 'createGroup' as const },
    { icon: Trophy, titleKey: 'leaderboard' as const, descKey: 'dailyLeaderboard' as const },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-blush-dark to-lilac-light islamic-pattern dark:from-plum-dark dark:via-plum-dark dark:to-plum">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Logo />
        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/10 text-rose font-bold text-sm transition-all hover:bg-white dark:hover:bg-white/20">
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
          <button onClick={toggleTheme} className="p-2 rounded-xl bg-white/60 dark:bg-white/10 text-rose transition-all hover:bg-white dark:hover:bg-white/20">
            {theme === 'light' ? <Moon size={18} /> : <Star size={18} />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-12 pb-20 max-w-5xl mx-auto text-center">
        <div className="relative inline-block mb-6 animate-float">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-primary to-rose rounded-full flex items-center justify-center shadow-xl shadow-pink-primary/30">
            <Moon size={40} className="text-white fill-white/30" />
          </div>
          <Star size={24} className="absolute -top-1 -end-1 text-champagne fill-champagne" />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-rose to-plum dark:from-pink-primary dark:to-pink-light bg-clip-text text-transparent leading-tight">
          {t(lang, 'appName')}
        </h1>
        <p className="text-lg md:text-xl text-plum dark:text-pink-light font-semibold mb-8 max-w-lg mx-auto">
          {t(lang, 'tagline')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button size="lg" onClick={() => navigate('/signup')} className="shadow-xl shadow-pink-primary/30">
            {t(lang, 'joinNow')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
            {t(lang, 'signInCta')}
          </Button>
          <InstallButton variant="outline" />
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="bg-card dark:bg-plum rounded-3xl p-6 card-shadow border border-pink-primary/10 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-primary/20 to-lilac flex items-center justify-center mb-3">
                  <Icon size={24} className="text-rose" />
                </div>
                <h3 className="font-extrabold text-plum dark:text-pink-light mb-1">{t(lang, f.titleKey)}</h3>
                <p className="text-sm text-plum/60 dark:text-pink-light/60">{t(lang, f.descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-plum/60 dark:text-pink-light/60">
        <p className="mb-2">{t(lang, 'appName')} — {t(lang, 'tagline')}</p>
        <p>© 2026 {t(lang, 'appName')}. {t(lang, 'allRightsReserved')}.</p>
      </footer>
    </div>
  );
}
