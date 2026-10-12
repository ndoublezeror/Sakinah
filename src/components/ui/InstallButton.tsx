import { useState, useEffect } from 'react';
import { Download, Monitor } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallButton({ variant = 'outline' }: { variant?: 'outline' | 'primary' }) {
  const { lang } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstructions(true);
    }
  };

  return (
    <>
      <Button variant={variant} onClick={handleInstall}>
        <Download size={18} />
        {lang === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
      </Button>

      <Modal
        open={showInstructions}
        onClose={() => setShowInstructions(false)}
        title={lang === 'ar' ? 'تثبيت التطبيق' : 'Install the App'}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-blush dark:bg-plum-dark/30 rounded-2xl p-4">
            <Monitor size={24} className="text-rose flex-shrink-0" />
            <p className="text-sm font-bold text-plum dark:text-pink-light">
              {lang === 'ar' ? 'على الكمبيوتر' : 'On Desktop'}
            </p>
          </div>
          <div className="space-y-2 text-sm text-plum/70 dark:text-pink-light/70">
            {lang === 'ar' ? (
              <>
                <p><strong>Chrome / Edge:</strong> انقر على أيقونة التثبيت</p>
                <p>في شريط العنوان بجانب النجمة، ثم اختر "تثبيت".</p>
                <p className="mt-3"><strong>أو من القائمة:</strong> انقر على</p>
                <p>⋮ (القائمة) → "تثبيت التطبيق".</p>
              </>
            ) : (
              <>
                <p><strong>Chrome / Edge:</strong> Click the install icon</p>
                <p>in the address bar next to the star, then choose "Install".</p>
                <p className="mt-3"><strong>Or from the menu:</strong> Click</p>
                <p>⋮ (menu) → "Install app" / "Install Step to Sakinah".</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 bg-blush dark:bg-plum-dark/30 rounded-2xl p-4">
            <Download size={24} className="text-rose flex-shrink-0" />
            <p className="text-sm font-bold text-plum dark:text-pink-light">
              {lang === 'ar' ? 'على الهاتف' : 'On Mobile'}
            </p>
          </div>
          <div className="space-y-2 text-sm text-plum/70 dark:text-pink-light/70">
            {lang === 'ar' ? (
              <>
                <p><strong>Android:</strong> افتح القائمة ⋮ في المتصفح</p>
                <p>واختر "إضافة إلى الشاشة الرئيسية".</p>
                <p className="mt-3"><strong>iPhone / iPad:</strong> اضغط على زر المشاركة</p>
                <p>واختر "إضافة إلى الشاشة الرئيسية".</p>
              </>
            ) : (
              <>
                <p><strong>Android:</strong> Open the browser menu ⋮</p>
                <p>and select "Add to Home screen".</p>
                <p className="mt-3"><strong>iPhone / iPad:</strong> Tap the Share button</p>
                <p>and select "Add to Home Screen".</p>
              </>
            )}
          </div>
          <Button fullWidth onClick={() => setShowInstructions(false)}>
            {lang === 'ar' ? 'فهمت' : 'Got it'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
