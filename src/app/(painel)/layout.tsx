// src/app/(painel)/layout.tsx
import { AuthWrapper } from '@/hooks/useAuth';
import { Inter } from 'next/font/google'; // Garante que 'Inter' está aqui
import '../globals.css'; // Importa estilos globais
import { Metadata } from 'next';
import React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Painel Elevva Web',
  description: 'Área do Cliente e Funcionário para gestão de chamados, orçamentos e serviços.',
};

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    // Usa a classe CSS da fonte Inter
    <div className={inter.className}> 
      <AuthWrapper>
        {children}
      </AuthWrapper>
    </div>
  );
}
