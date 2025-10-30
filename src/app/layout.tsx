// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google'; // Certifique-se de que SÓ 'Inter' está sendo importada daqui
import { ToastProvider } from '@/components/ToastProvider';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AuthWrapper } from '@/hooks/useAuth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Elevva Web | Soluções Digitais Profissionais',
  description: 'Desenvolvimento de sites e web apps modernos com Next.js, TypeScript e Supabase.',
  icons: {
    icon: '/favicon.ico', // Caminho absoluto para o arquivo na raiz
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* AuthWrapper é usado em (painel)/layout.tsx, mas se for usado em toda a aplicação, ele deve estar aqui */}
        {children}
        <ToastProvider />
        <WhatsAppButton />
      </body>
    </html>
  );
}
