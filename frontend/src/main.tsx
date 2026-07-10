import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { DreamProvider } from './context/DreamContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DreamProvider>
        <App />
      </DreamProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
