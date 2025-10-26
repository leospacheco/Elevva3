// src/app/(painel)/dashboard/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
// IMPORTAÇÕES CORRIGIDAS: useState e Link adicionados, useQuery removido
import React, { useState } from 'react';
import Link from 'next/link'; 
import { Briefcase, DollarSign, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
// import { Chamado, Orcamento, Servico } from '@/types/app'; // Tipos não usados diretamente aqui
// import { useQuery } from '@supabase/auth-helpers-react'; // REMOVIDO: Não é necessário aqui

// Card de Estatística
const StatsCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: React.ElementType, colorClass: string }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <Icon size={36} className={`${colorClass} opacity-60`} />
    </div>
);

// Função para buscar dados do cliente
const fetchClientData = async (userId: string) => {
    // Busca chamados abertos
    const { data: chamadosData } = await supabase
        .from('chamados')
        .select('id')
        .eq('cliente_id', userId)
        .eq('status', 0); // 0: aberto

    // Busca orçamentos pendentes
    const { data: orcamentosData } = await supabase
        .from('orcamentos')
        .select('id')
        .eq('cliente_id', userId)
        .eq('status', 0); // 0: pendente

    // Busca serviços em andamento
    const { data: servicosData } = await supabase
        .from('servicos')
        .select('id')
        .eq('cliente_id', userId)
        .eq('status', 1); // 1: em_desenvolvimento

    return {
        chamadosAbertos: chamadosData?.length || 0,
        orcamentosPendentes: orcamentosData?.length || 0,
        servicosAndamento: servicosData?.length || 0,
    };
};

export default function DashboardPage() {
    // Hooks usados no topo
    const { profile, isEmployee, isClient, isLoading } = useAuth();
    
    // Simulação de hook de busca de dados (Usamos useState por simplicidade)
    const [stats, setStats] = useState({ chamadosAbertos: 0, orcamentosPendentes: 0, servicosAndamento: 0 });

    React.useEffect(() => {
        if (profile && profile.id && isClient) {
            fetchClientData(profile.id).then(setStats);
        }
    }, [profile, isClient]);

    if (isLoading) {
        return <PainelLayout><div className="text-white">Carregando...</div></PainelLayout>;
    }

    // --- PAINEL DO FUNCIONÁRIO/ADMIN (Redirecionamento) ---
    if (isEmployee) {
        return (
            <PainelLayout>
                <div className="bg-blue-900/40 p-6 rounded-xl border-l-4 border-blue-500 text-white">
                    <h1 className="text-3xl font-extrabold mb-4">Bem-vindo(a), {profile?.nome}!</h1>
                    <p className="text-xl">
                        Você acessou a <span className='text-blue-300'>Área Administrativa.</span>
                    </p>
                    <p className="mt-2 text-gray-300">
                        Use o menu lateral para gerenciar **Clientes, Chamados, Orçamentos e Serviços.**
                    </p>
                </div>
            </PainelLayout>
        );
    }
    
    // --- PAINEL DO CLIENTE (Role 0) ---
    return (
        <PainelLayout>
            <h1 className="text-3xl font-extrabold text-white mb-8">
                Olá, {profile?.nome}! Bem-vindo ao Painel.
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatsCard 
                    title="Chamados Abertos" 
                    value={stats.chamadosAbertos} 
                    icon={MessageSquare} 
                    colorClass="text-red-400"
                />
                <StatsCard 
                    title="Orçamentos Pendentes" 
                    value={stats.orcamentosPendentes} 
                    icon={DollarSign} 
                    colorClass="text-yellow-400"
                />
                <StatsCard 
                    title="Serviços em Andamento" 
                    value={stats.servicosAndamento} 
                    icon={Briefcase} 
                    colorClass="text-blue-400"
                />
            </div>

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/chamados/novo" className="bg-blue-600 p-4 rounded-lg text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center">
                        <Clock size={20} className="mr-2" /> Abrir Novo Chamado
                    </Link>
                    <Link href="/orcamentos" className="bg-yellow-600 p-4 rounded-lg text-white font-semibold hover:bg-yellow-700 transition flex items-center justify-center">
                        <DollarSign size={20} className="mr-2" /> Meus Orçamentos
                    </Link>
                    <Link href="/servicos" className="bg-green-600 p-4 rounded-lg text-white font-semibold hover:bg-green-700 transition flex items-center justify-center">
                        <CheckCircle size={20} className="mr-2" /> Status dos Projetos
                    </Link>
                </div>
            </div>
        </PainelLayout>
    );
}
