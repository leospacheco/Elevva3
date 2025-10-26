// src/components/layout/PainelLayout.tsx
'use client';

// CORREÇÃO: useState importado do React
import React, { ReactNode, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Menu, X, Home, Users, ScrollText, DollarSign, Briefcase, MessageSquare, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Componente de navegação (Item da sidebar)
const NavItem = ({ href, icon: Icon, label, isActive }: { href: string, icon: React.ElementType, label: string, isActive: boolean }) => (
    <Link href={href} className={`flex items-center p-3 rounded-lg transition duration-150 ${
        isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}>
        <Icon size={20} className="mr-3" />
        <span className="font-medium">{label}</span>
    </Link>
);

// Componente principal do Layout
export const PainelLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { profile, isLoading, signOut, isEmployee } = useAuth();
    // Hooks no topo
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-900 text-white">
                <Loader2 className="animate-spin mr-2" size={32} /> Carregando perfil...
            </div>
        );
    }
    
    // Se o profile for null aqui, o middleware deve ter redirecionado para /login

    const roleName = profile?.role === 2 ? 'Administrador' : profile?.role === 1 ? 'Funcionário' : 'Cliente';

    // Definição dos links de navegação
    const clientNavItems = [
        { href: '/dashboard', icon: Home, label: 'Dashboard' },
        { href: '/chamados', icon: MessageSquare, label: 'Meus Chamados' },
        { href: '/orcamentos', icon: DollarSign, label: 'Meus Orçamentos' },
        { href: '/servicos', icon: Briefcase, label: 'Meus Serviços' },
    ];

    // Note que /admin/convidar (Fase 6) virá depois
    const employeeNavItems = [
        { href: '/dashboard', icon: Home, label: 'Visão Geral' }, // Redireciona para o painel admin
        { href: '/clientes', icon: Users, label: 'Clientes' },
        { href: '/chamados', icon: MessageSquare, label: 'Gerenciar Chamados' },
        { href: '/orcamentos', icon: DollarSign, label: 'Gerenciar Orçamentos' },
        { href: '/servicos', icon: Briefcase, label: 'Gerenciar Serviços' },
        
    ];
    
    // Rotas do Admin/Employee serão acessadas através de /dashboard. Redirecionamento lógico já está no dashboard.
    const navItems = isEmployee ? employeeNavItems : clientNavItems;

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar (Desktop) */}
            <aside className={`w-64 bg-gray-800 border-r border-gray-700 p-4 hidden md:flex flex-col flex-shrink-0`}>
                <div className="flex items-center justify-center p-2 mb-6">
                    <Image 
                        src="/images/logo-elevva.jpg" 
                        alt="Logo Elevva Web" 
                        width={150} 
                        height={50} 
                        className="h-10 w-auto object-contain"
                    />
                </div>
                
                <nav className="flex-grow space-y-1">
                    {navItems.map(item => (
                        <NavItem 
                            key={item.href}
                            href={item.href}
                            icon={item.icon}
                            label={item.label}
                            // Ativo se o pathname for exato OU se for uma rota mais profunda (ex: /chamados/123)
                            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && pathname.length > item.href.length)}
                        />
                    ))}
                </nav>

                {/* Perfil e Logout */}
                <div className="pt-4 border-t border-gray-700 mt-auto">
                    <div className="text-sm text-gray-400 mb-2">
                        <p className="font-bold text-white truncate">{profile?.nome || profile?.email}</p>
                        <p className="text-blue-400">{roleName}</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-gray-700 transition"
                    >
                        <LogOut size={20} className="mr-3" />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Conteúdo Principal */}
            <main className="flex-1 flex flex-col overflow-y-auto">
                {/* Header (Mobile) */}
                <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-white">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-white">Painel {roleName}</h1>
                    <div className="w-8"></div> {/* Placeholder */}
                </header>

                {/* Main Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    {children}
                </div>
            </main>

            {/* Sidebar Mobile (Modal) */}
            <div 
                className={`fixed inset-0 z-40 bg-black bg-opacity-75 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            >
                <aside 
                    className={`w-64 bg-gray-800 h-full p-4 flex flex-col transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-2 mb-6 border-b border-gray-700 pb-4">
                        <Image 
                            src="/images/logo-elevva.jpg" 
                            alt="Logo Elevva Web" 
                            width={120} 
                            height={40} 
                            className="h-8 w-auto object-contain"
                        />
                         <button onClick={() => setIsSidebarOpen(false)} className="text-white hover:text-gray-300">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <nav className="flex-grow space-y-1">
                        {navItems.map(item => (
                            <NavItem 
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && pathname.length > item.href.length)}
                            />
                        ))}
                    </nav>

                    <div className="pt-4 border-t border-gray-700 mt-auto">
                        <div className="text-sm text-gray-400 mb-2">
                            <p className="font-bold text-white truncate">{profile?.nome || profile?.email}</p>
                            <p className="text-blue-400">{roleName}</p>
                        </div>
                        <button
                            onClick={signOut}
                            className="flex items-center w-full p-3 rounded-lg text-red-400 hover:bg-gray-700 transition"
                        >
                            <LogOut size={20} className="mr-3" />
                            Sair
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};
