import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';

export function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);

    if (signInError) {
      setError(signInError.includes('Invalid') ? t(lang, 'invalidCredentials') : signInError);
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
          <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light">{t(lang, 'welcomeBack')}</h1>
          <p className="text-sm text-plum/60 dark:text-pink-light/60 mt-1">{t(lang, 'tagline')}</p>
        </div>

        <div className="bg-card dark:bg-plum rounded-3xl card-shadow p-6 border border-pink-primary/10 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="text-end">
              <Link to="/reset-password" className="text-sm text-rose font-bold hover:underline">
                {t(lang, 'forgotPassword')}
              </Link>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400 font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              {loading ? t(lang, 'loggingIn') : t(lang, 'login')}
            </Button>
          </form>

          <p className="text-center text-sm text-plum/60 dark:text-pink-light/60 mt-4">
            {t(lang, 'noAccount')}{' '}
            <Link to="/signup" className="text-rose font-bold hover:underline">{t(lang, 'signup')}</Link>
          </p>
        </div>

        <p className="text-center text-sm text-plum/60 dark:text-pink-light/60 mt-4">
          <Link to="/" className="hover:underline">← {t(lang, 'home')}</Link>
        </p>
      </div>
    </div>
  );
}
