import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import MobileApp from './components/mobile/MobileApp.tsx';
import PublicWebsiteApp from './components/modules/website/site/PublicWebsiteApp.tsx';
import './index.css';

const JALUR_SITUS_PUBLIK = /^\/web\/?/;
const JALUR_MOBILE = /^\/mobile\/?/;

const jalur = window.location.pathname;
const rootElement = JALUR_MOBILE.test(jalur) ? (
  <MobileApp />
) : JALUR_SITUS_PUBLIK.test(jalur) ? (
  <PublicWebsiteApp />
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(rootElement);
