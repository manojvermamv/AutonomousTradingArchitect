import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from '../components/App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('React preview root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
