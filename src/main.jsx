import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';   // <-- make sure this line exists

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
