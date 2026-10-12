import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { t } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/ui/Logo';

export function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { lang } = useI18n();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await resetPassword(email);
    setLoading(false);

    if (resetError) {
      setError(resetError);
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-blush-dark to-lilac-light islamic-pattern dark:from-plum-dark dark:via-plum-dark dark:to-plum flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-block mb-4 animate-float">
            <Logo size="lg" />
          </div>
        </div>

        <div className="bg-card dark:bg-plum rounded-3xl card-shadow p-6 border border-pink-primary/10 animate-slide-up">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4 animate-pop-in">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h1 className="text-xl font-extrabold text-plum dark:text-pink-light mb-2">{t(lang, 'emailSent')}</h1>
              <Link to="/login" className="text-rose font-bold hover:underline inline-flex items-center gap-1 mt-4">
                <ArrowLeft size={16} /> {t(lang, 'backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-plum dark:text-pink-light mb-2">{t(lang, 'resetPassword')}</h1>
              <p className="text-sm text-plum/60 dark:text-pink-light/60 mb-6">{t(lang, 'forgotPassword')}</p>

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

                {error && (
                  <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400 font-semibold">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth size="lg" loading={loading}>
                  {loading ? t(lang, 'sending') : t(lang, 'sendResetLink')}
                </Button>
              </form>

              <p className="text-center text-sm text-plum/60 dark:text-pink-light/60 mt-4">
                <Link to="/login" className="text-rose font-bold hover:underline inline-flex items-center gap-1">
                  <ArrowLeft size={14} /> {t(lang, 'backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
