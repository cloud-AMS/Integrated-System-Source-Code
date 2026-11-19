import { lazy, Suspense } from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

const App = lazy(() => import('./App.tsx'));
const MobileApp = lazy(() => import('./components/mobile/MobileApp.tsx'));
const PublicWebsiteApp = lazy(() => import('./components/modules/website/site/PublicWebsiteApp.tsx'));

const JALUR_SITUS_PUBLIK = /^\/web\/?/;
const JALUR_MOBILE = /^\/mobile\/?/;

const jalur = window.location.pathname;
const Halaman = JALUR_MOBILE.test(jalur) ? (
  <MobileApp />
) : JALUR_SITUS_PUBLIK.test(jalur) ? (
  <PublicWebsiteApp />
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(
  <Suspense
    fallback={
      <div role="status" aria-live="polite" className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Memuat AMS…
      </div>
    }
  >
    {Halaman}
  </Suspense>
);
