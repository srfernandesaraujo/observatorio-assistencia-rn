import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { aplicarPreferencias, lerPreferencias } from './lib/acessibilidade';
import './index.css';

// Aplica as preferências de acessibilidade antes de desenhar a página, para ela não "piscar" ao carregar.
aplicarPreferencias(lerPreferencias());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
