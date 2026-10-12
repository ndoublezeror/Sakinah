import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onRegisteredSW(_url: string, registration: ServiceWorkerRegistration | undefined) {
    if (registration) {
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60000);
    }
  },
  onRegisterError(error: unknown) {
    console.error('SW registration failed', error);
  },
});
