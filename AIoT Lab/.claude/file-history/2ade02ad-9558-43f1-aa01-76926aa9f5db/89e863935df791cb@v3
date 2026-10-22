import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { createWebObsidianApp } from './utils/webVaultAdapter';
import '@/styles/globals.css';

const webApp = createWebObsidianApp('/api/fs');

const rootEl = document.getElementById('root')!;
rootEl.classList.add('hazard-trigger-view-container');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App app={webApp as any} />
  </React.StrictMode>
);
