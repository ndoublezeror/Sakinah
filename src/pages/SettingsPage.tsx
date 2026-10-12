import { useState } from 'react';
import { Moon, Sun, Languages, AtSign, User, Check, LogOut, Bell, BellOff, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useReminder } from '@/hooks/useReminder';
import { t } from '@/lib/i18n';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';
import { InstallButton } from '@/components/ui/InstallButton';

export function SettingsPage() {
  const { profile, signOut, updateProfile, checkUsername } = useAuth();
  const { lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const reminder = useReminder();

  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');
  const [editingDisplay, setEditingDisplay] = useState(false);
  const [newDisplay, setNewDisplay] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleUsernameCheck = async (value: string) => {
    setNewUsername(value);
    if (value.length < 3) { setUsernameStatus('idle'); return; }
    if (value.toLowerCase() === profile?.username.toLowerCase()) { setUsernameStatus('available'); return; }
    setUsernameStatus('checking');
    const { taken } = await checkUsername(value);
    setUsernameStatus(taken ? 'taken' : 'available');
  };

  const handleSaveUsername = async () => {
    setError(null);
    if (usernameStatus === 'taken') { setError(t(lang, 'usernameTaken')); return; }
    if (newUsername.length < 3) return;
    const { error: err } = await updateProfile({ username: newUsername.trim() });
    if (err) { setError(err); return; }
    setEditingUsername(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveDisplay = async () => {
    setError(null);
    if (newDisplay.trim().length < 1) return;
    const { error: err } = await updateProfile({ display_name: newDisplay.trim() });
    if (err) { setError(err); return; }
    setEditingDisplay(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Sync language preference to profile
  const handleLangChange = (newLang: 'en' | 'ar') => {
    setLang(newLang);
    if (profile) updateProfile({ language: newLang });
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (profile) updateProfile({ theme: newTheme });
  };

  if (!profile) return null;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center pt-2">
        <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'settings')}</h1>
      </div>

      {/* Profile header */}
      <Card className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-primary to-rose flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0">
          {profile.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-plum dark:text-pink-light text-lg truncate">{profile.display_name}</p>
          <p className="text-sm text-rose font-bold">@{profile.username}</p>
        </div>
      </Card>

      {/* Account info */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm">{t(lang, 'accountInfo')}</h2>
        <div className="space-y-3">
          {/* Display name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={16} className="text-plum/40 dark:text-pink-light/40" />
              <div>
                <p className="text-xs text-plum/50 dark:text-pink-light/50 font-bold">{t(lang, 'displayName')}</p>
                <p className="text-sm text-plum dark:text-pink-light font-bold">{profile.display_name}</p>
              </div>
            </div>
            {editingDisplay ? (
              <div className="flex items-center gap-2">
                <Input value={newDisplay} onChange={e => setNewDisplay(e.target.value)} placeholder={profile.display_name} className="w-32 text-sm py-1.5" />
                <Button size="sm" onClick={handleSaveDisplay}><Check size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDisplay(false)}>×</Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => { setNewDisplay(profile.display_name); setEditingDisplay(true); }}>{t(lang, 'edit')}</Button>
            )}
          </div>

          {/* Username */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AtSign size={16} className="text-plum/40 dark:text-pink-light/40" />
              <div>
                <p className="text-xs text-plum/50 dark:text-pink-light/50 font-bold">{t(lang, 'username')}</p>
                <p className="text-sm text-plum dark:text-pink-light font-bold">@{profile.username}</p>
              </div>
            </div>
            {editingUsername ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Input value={newUsername} onChange={e => handleUsernameCheck(e.target.value.replace(/\s/g, ''))} placeholder="new_username" className="w-32 text-sm py-1.5" />
                  <Button size="sm" onClick={handleSaveUsername} disabled={usernameStatus !== 'available'}><Check size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingUsername(false)}>×</Button>
                </div>
                {usernameStatus === 'checking' && <p className="text-[10px] text-plum/50">{t(lang, 'checkingUsername')}</p>}
                {usernameStatus === 'available' && <p className="text-[10px] text-green-500 font-bold">{t(lang, 'usernameAvailable')}</p>}
                {usernameStatus === 'taken' && <p className="text-[10px] text-red-500 font-bold">{t(lang, 'usernameTaken')}</p>}
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => { setNewUsername(profile.username); setUsernameStatus('available'); setEditingUsername(true); }}>{t(lang, 'changeUsername')}</Button>
            )}
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-semibold mt-2">{error}</p>}
        {saved && <p className="text-xs text-green-500 font-bold mt-2">{t(lang, 'saved')}</p>}
      </Card>

      {/* Language */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm flex items-center gap-2">
          <Languages size={16} className="text-rose" />
          {t(lang, 'language')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleLangChange('en')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${lang === 'en' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'bg-blush dark:bg-plum-dark/40 text-plum/60 dark:text-pink-light/60'}`}
          >
            {t(lang, 'english')}
          </button>
          <button
            onClick={() => handleLangChange('ar')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all font-arabic ${lang === 'ar' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'bg-blush dark:bg-plum-dark/40 text-plum/60 dark:text-pink-light/60'}`}
          >
            {t(lang, 'arabic')}
          </button>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-3 text-sm">{t(lang, 'theme')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${theme === 'light' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'bg-blush dark:bg-plum-dark/40 text-plum/60 dark:text-pink-light/60'}`}
          >
            <Sun size={18} /> {t(lang, 'lightMode')}
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${theme === 'dark' ? 'bg-gradient-to-r from-pink-primary to-rose text-white' : 'bg-blush dark:bg-plum-dark/40 text-plum/60 dark:text-pink-light/60'}`}
          >
            <Moon size={18} /> {t(lang, 'darkMode')}
          </button>
        </div>
      </Card>

      {/* Daily Reminder */}
      <Card>
        <h2 className="font-extrabold text-plum dark:text-pink-light mb-1 text-sm flex items-center gap-2">
          {reminder.settings.enabled ? <Bell size={16} className="text-rose" /> : <BellOff size={16} className="text-plum/40 dark:text-pink-light/40" />}
          {t(lang, 'dailyReminder')}
        </h2>
        <p className="text-xs text-plum/50 dark:text-pink-light/50 mb-4">{t(lang, 'reminderDesc')}</p>

        {/* Enable toggle */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-plum dark:text-pink-light">{t(lang, 'enableReminder')}</span>
          <button
            onClick={reminder.toggleEnabled}
            className={`relative w-12 h-7 rounded-full transition-all ${reminder.settings.enabled ? 'bg-gradient-to-r from-pink-primary to-rose' : 'bg-plum/20 dark:bg-pink-light/20'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${reminder.settings.enabled ? 'start-6' : 'start-1'}`} />
          </button>
        </div>

        {/* Time picker */}
        {reminder.settings.enabled && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-plum/40 dark:text-pink-light/40 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-plum/50 dark:text-pink-light/50 font-bold mb-1">{t(lang, 'reminderTime')}</p>
                <input
                  type="time"
                  value={reminder.settings.time}
                  onChange={e => reminder.setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-blush dark:bg-plum-dark/40 border border-pink-primary/20 text-plum dark:text-pink-light font-bold text-sm focus:outline-none focus:border-rose"
                />
              </div>
            </div>

            {/* Notification permission */}
            {reminder.permission !== 'granted' && reminder.permission !== 'unsupported' && (
              <div className="bg-lilac/20 dark:bg-lilac/10 rounded-2xl p-3">
                <p className="text-xs text-plum/60 dark:text-pink-light/60 mb-2">{t(lang, 'reminderPermissionDenied')}</p>
                <Button size="sm" onClick={reminder.requestNotificationPermission}>
                  <Bell size={14} /> {t(lang, 'reminderEnableNotifications')}
                </Button>
              </div>
            )}
            {reminder.permission === 'granted' && (
              <div className="flex items-center gap-2 text-xs text-green-500 font-bold">
                <Check size={14} /> {t(lang, 'reminderPermissionGranted')}
              </div>
            )}
            {reminder.permission === 'unsupported' && (
              <p className="text-xs text-plum/50 dark:text-pink-light/50">{t(lang, 'reminderPermissionDenied')}</p>
            )}
          </div>
        )}
      </Card>

      {/* Logout */}
      <Button variant="danger" fullWidth size="lg" onClick={handleSignOut}>
        <LogOut size={18} /> {t(lang, 'logout')}
      </Button>

      {/* Install app */}
      <InstallButton variant="outline" />

      <div className="text-center pt-4">
        <Logo size="sm" />
        <p className="text-xs text-plum/40 dark:text-pink-light/40 mt-2">© 2026 {t(lang, 'appName')}</p>
      </div>
    </div>
  );
}
