import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import './index.css';

// Register service worker with automatic update checks
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, auto-updating service worker...');
  },
  onOfflineReady() {
    console.log('Taktic is ready to work offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

