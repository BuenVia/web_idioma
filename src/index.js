import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { LevelsProvider } from './context/LevelsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* BrowserRouter enables page URLs. LanguageProvider and LevelsProvider
        load the languages and CEFR levels from the backend and share them. */}
    <BrowserRouter>
      <LanguageProvider>
        <LevelsProvider>
          <App />
        </LevelsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
