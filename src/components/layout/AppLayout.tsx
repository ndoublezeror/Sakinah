import { useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, ListChecks, BookOpen, Sparkles, Trophy,
  Users, BarChart3, Settings, LogOut, Moon, Sun,
  Languages, Heart, X, Grid,
} from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { t, type TranslationKey } from '@/lib/i18n';
import { Logo } from '@/components/ui/Logo';

type NavItem = {
  to: string;
  icon: typeof Home;
  labelKey: TranslationKey;
};

const navItems: NavItem[] = [
  { to: '/dashboard', icon: Home, labelKey: 'dashboard' },
  { to: '/tracker', icon: ListChecks, labelKey: 'tracker' },
  { to: '/tasbih', icon: Sparkles, labelKey: 'tasbih' },
  { to: '/quran', icon: BookOpen, labelKey: 'quranJournal' },
  { to: '/knowledge', icon: Heart, labelKey: 'knowledge' },
  { to: '/leaderboard', icon: Trophy, labelKey: 'leaderboard' },
  { to: '/groups', icon: Users, labelKey: 'groups' },
  { to: '/progress', icon: BarChart3, labelKey: 'weeklyProgress' },
];

const bottomNavItems: NavItem[] = [
  { to: '/dashboard', icon: Home, labelKey: 'dashboard' },
  { to: '/tracker', icon: ListChecks, labelKey: 'tracker' },
  { to: '/tasbih', icon: Sparkles, labelKey: 'tasbih' },
  { to: '/knowledge', icon: Heart, labelKey: 'knowledge' },
  { to: '/leaderboard', icon: Trophy, labelKey: 'leaderboard' },
];

const moreItems: NavItem[] = [
  { to: '/quran', icon: BookOpen, labelKey: 'quranJournal' },
  { to: '/groups', icon: Users, labelKey: 'groups' },
  { to: '/progress', icon: BarChart3, labelKey: 'weeklyProgress' },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { lang, toggleLang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-app islamic-pattern flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-e border-pink-primary/10 p-4 sticky top-0 h-screen">
        <div className="mb-8 mt-2">
          <Logo />
        </div>
        <p className="text-xs text-plum/60 dark:text-pink-light/60 mb-4 font-semibold italic px-2">
          {t(lang, 'tagline')}
        </p>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-primary to-rose text-white shadow-md shadow-pink-primary/20'
                      : 'text-plum/70 dark:text-pink-light/70 hover:bg-pink-primary/10'
                  }`
                }
              >
                <Icon size={20} />
                {t(lang, item.labelKey)}
              </NavLink>
            );
          })}
        </nav>
        <div className="space-y-1 pt-4 border-t border-pink-primary/10">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-pink-primary/15 text-rose'
                  : 'text-plum/70 dark:text-pink-light/70 hover:bg-pink-primary/10'
              }`
            }
          >
            <Settings size={20} />
            {t(lang, 'settings')}
          </NavLink>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-sm text-plum/70 dark:text-pink-light/70 hover:bg-red-500/10 hover:text-red-500 transition-all w-full"
          >
            <LogOut size={20} />
            {t(lang, 'logout')}
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-pink-primary/10 px-4 py-3 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLang}
            className="p-2 rounded-xl bg-pink-primary/10 text-rose font-bold text-sm transition-all active:scale-90"
          >
            {lang === 'en' ? 'ع' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-pink-primary/10 text-rose transition-all active:scale-90"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24 md:pb-8 overflow-x-hidden">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Desktop header controls */}
      <div className="hidden md:flex absolute top-4 end-8 items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-pink-primary/20 text-rose font-bold text-sm hover:bg-pink-primary/10 transition-all"
        >
          <Languages size={16} />
          {lang === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-card border border-pink-primary/20 text-rose hover:bg-pink-primary/10 transition-all"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        {profile && (
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-pink-primary/20 hover:bg-pink-primary/10 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-primary to-rose flex items-center justify-center text-white font-bold text-sm">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
            <span className="font-bold text-sm text-plum dark:text-pink-light max-w-24 truncate">
              {profile.display_name}
            </span>
          </button>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-card/90 backdrop-blur-md border-t border-pink-primary/10 px-2 py-1.5 flex items-center justify-around">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl font-bold text-[10px] transition-all ${
                  isActive
                    ? 'text-rose'
                    : 'text-plum/50 dark:text-pink-light/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} className={isActive ? 'text-rose' : ''} />
                  {t(lang, item.labelKey)}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile more menu - floating button */}
      <button
        onClick={() => setMoreOpen(true)}
        className="md:hidden fixed bottom-20 end-3 z-30 w-12 h-12 rounded-full bg-gradient-to-br from-pink-primary to-rose text-white shadow-lg shadow-pink-primary/30 flex items-center justify-center active:scale-90 transition-all"
      >
        <Grid size={20} />
      </button>

      {/* Mobile more menu - drawer */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
          <div
            className="relative w-full bg-card rounded-t-3xl border-t border-pink-primary/20 p-5 pb-8 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-plum dark:text-pink-light text-sm">{lang === 'ar' ? 'المزيد' : 'More'}</h2>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-xl hover:bg-pink-primary/10 text-plum/60 dark:text-pink-light/60">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.to;
                return (
                  <button
                    key={item.to}
                    onClick={() => { navigate(item.to); setMoreOpen(false); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                      active
                        ? 'bg-gradient-to-br from-pink-primary to-rose text-white'
                        : 'bg-blush dark:bg-plum-dark/40 text-plum dark:text-pink-light'
                    }`}
                  >
                    <Icon size={24} />
                    <span className="text-[10px] font-bold text-center leading-tight">{t(lang, item.labelKey)}</span>
                  </button>
                );
              })}
              <button
                onClick={() => { navigate('/settings'); setMoreOpen(false); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                  location.pathname === '/settings'
                    ? 'bg-gradient-to-br from-pink-primary to-rose text-white'
                    : 'bg-blush dark:bg-plum-dark/40 text-plum dark:text-pink-light'
                }`}
              >
                <Settings size={24} />
                <span className="text-[10px] font-bold text-center leading-tight">{t(lang, 'settings')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
