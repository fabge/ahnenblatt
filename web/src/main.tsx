import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Framework7 from 'framework7/lite-bundle';
import Framework7React from 'framework7-react';
import 'framework7-icons/css/framework7-icons.css';
import './index.css';
import App from './App';

// eslint-disable-next-line react-hooks/rules-of-hooks -- F7 initialization, not a React Hook
Framework7.use(Framework7React);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
