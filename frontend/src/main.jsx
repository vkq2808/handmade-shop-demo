// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { AuthProvider } from './contexts/auth.context';
import { CartProvider } from './contexts/cart.context.jsx';
import { ToastProvider } from './contexts/toast.context.jsx';
import { FavoriteProvider } from './contexts/favorite.context.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <FavoriteProvider>
            <App />
          </FavoriteProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
