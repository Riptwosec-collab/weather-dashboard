import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(
        registrations
          .filter((registration) => registration.scope.includes('/weather-dashboard'))
          .map((registration) => registration.unregister()),
      ))
      .catch(() => undefined);
  });
}

if ('caches' in window) {
  window.addEventListener('load', () => {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
