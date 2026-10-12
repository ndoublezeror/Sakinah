import { Moon, Star } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { t } from '@/lib/i18n';

export function Logo({ size = 'md', withText = true }: { size?: 'sm' | 'md' | 'lg'; withText?: boolean }) {
  const sizes = {
    sm: { icon: 28, text: 'text-lg' },
    md: { icon: 36, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
  };
  const s = sizes[size];
  const { lang } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: s.icon, height: s.icon }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-primary to-rose rounded-full flex items-center justify-center shadow-md shadow-pink-primary/30">
          <Moon size={s.icon * 0.55} className="text-white fill-white/30" />
        </div>
        <Star
          size={s.icon * 0.3}
          className="absolute -top-0.5 -end-0.5 text-champagne fill-champagne"
        />
      </div>
      {withText && (
        <span className={`font-extrabold ${s.text} bg-gradient-to-r from-rose to-plum dark:from-pink-primary dark:to-pink-light bg-clip-text text-transparent`}>
          {t(lang, 'appName')}
        </span>
      )}
    </div>
  );
}
