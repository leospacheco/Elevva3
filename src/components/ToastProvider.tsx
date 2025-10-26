// src/components/ToastProvider.tsx
'use client';

import { Toaster } from 'react-hot-toast';

// Componente para exibir alertas de forma moderna (como notifications)
export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
        success: {
          iconTheme: {
            primary: '#10B981', // Verde
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444', // Vermelho
            secondary: '#fff',
          },
        },
      }}
    />
  );
};
