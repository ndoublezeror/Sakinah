import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, AtSign, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';

export function SignupPage() {
  const { signUp, checkUsername, user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  useEffect(() => {
    if (username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const { taken, error: err } = await checkUsername(username);
      if (err) { setUsernameStatus('idle'); return; }
      setUsernameStatus(taken ? 'taken' : 'available');
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (username.length < 3) {
      setError(lang === 'ar' ? 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' : 'Username must be at least 3 characters');
      return;
    }
    if (usernameStatus === 'taken') {
      setError(t(lang, 'usernameTaken'));
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, username, displayName);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-blush-dark to-lilac-light islamic-pattern dark:from-plum-dark dark:via-plum-dark dark:to-plum flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-block mb-4 animate-float">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'createAccount')}</h1>
          <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-1">{t(lang, 'tagline')}</p>
        </div>

        <div className="bg-card dark:bg-plum rounded-3xl card-shadow p-6 border border-pink-primary/10 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t(lang, 'displayName')}
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسمك الجميل' : 'Your beautiful name'}
              icon={<User size={18} />}
              required
            />
            <div>
              <Input
                label={t(lang, 'username')}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="sara123"
                icon={<AtSign size={18} />}
                required
              />
              {usernameStatus === 'checking' && (
                <p className="text-xs text-plum/50 mt-1">{t(lang, 'checkingUsername')}</p>
              )}
              {usernameStatus === 'available' && (
                <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1">
                  <Star size={12} className="fill-green-500" /> {t(lang, 'usernameAvailable')}
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-xs text-red-500 font-semibold mt-1">{t(lang, 'usernameTaken')}</p>
              )}
            </div>
            <Input
              label={t(lang, 'email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail size={18} />}
              required
            />
            <Input
              label={t(lang, 'password')}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
              required
            />
            <Input
              label={t(lang, 'confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={18} />}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400 font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? t(lang, 'signingUp') : t(lang, 'signup')}
            </Button>
          </form>

          <p className="text-center text-sm text-plum/60 dark:text-pink-light/60 mt-4">
            {t(lang, 'haveAccount')}{' '}
            <Link to="/login" className="text-rose font-bold hover:underline">{t(lang, 'login')}</Link>
          </p>
        </div>

        <p className="text-center text-sm text-plum/60 dark:text-pink-light/60 mt-4">
          <Link to="/" className="hover:underline">← {t(lang, 'home')}</Link>
        </p>
      </div>
    </div>
  );
}
