import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
export const supabase = createClient(
  'https://bpbyhdjdezynyiclqezy.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
