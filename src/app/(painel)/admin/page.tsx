// src/app/(painel)/admin/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, MessageSquare, DollarSign, Briefcase, Users, UserPlus, Clock } from 'lucide-react';
import Link from 'next/link';

// Interface para os dados do Admin
interface AdminStats {
    totalClientes: number;
    chamadosEmAndamento: number;
    orcamentosPendentes: number;
    servicosEmDesenvolvimento: number;
}

// Card de Estatística
const AdminStatsCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string | number, icon: React.ElementType, colorClass: string }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
        </div>
        <Icon size={36} className={`${colorClass} opacity-60`} />
    </div>
);

// Função para buscar dados do Admin
const fetchAdminData = async () => {
    // Total de Clientes (Role 0)
    const { count: totalClientes } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 0);

    // Chamados em Andamento (Status 1)
    const { count: chamadosEmAndamento } = await supabase
        .from('chamados')
        .select('*', { count: 'exact', head: true })
        .eq('status', 1); // 1: em_andamento

    // Orçamentos Pendentes (Status 0)
    const { count: orcamentosPendentes } = await supabase
        .from('orcamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 0); // 0: pendente

    // Serviços em Desenvolvimento (Status 1)
    const { count: servicosEmDesenvolvimento } = await supabase
        .from('servicos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 1); // 1: em_desenvolvimento

    return {
        totalClientes: totalClientes || 0,
        chamadosEmAndamento: chamadosEmAndamento || 0,
        orcamentosPendentes: orcamentosPendentes || 0,
        servicosEmDesenvolvimento: servicosEmDesenvolvimento || 0,
    } as AdminStats;
};

export default function AdminDashboardPage() {
    const { profile, isEmployee, isAdmin, isLoading } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isEmployee) {
            fetchAdminData().then(setStats).finally(() => setLoading(false));
        }
    }, [isEmployee]);

    if (!isEmployee) {
        // O middleware deve barrar o acesso, mas garantimos a UX
        return (
            <PainelLayout>
                <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                    Acesso Negado.
                </div>
            </PainelLayout>
        );
    }

    return (
        <PainelLayout>
            <h1 className="text-3xl font-extrabold text-white mb-8">
                Visão Geral {isAdmin ? 'Administrativa' : 'do Funcionário'}
            </h1>

            {loading ? (
                <div className="flex justify-center items-center h-40 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Carregando Dados...
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <AdminStatsCard
                        title="Total de Clientes"
                        value={stats?.totalClientes || 0}
                        icon={Users}
                        colorClass="text-green-400"
                    />
                    <AdminStatsCard
                        title="Chamados em Andamento"
                        value={stats?.chamadosEmAndamento || 0}
                        icon={MessageSquare}
                        colorClass="text-yellow-400"
                    />
                    <AdminStatsCard
                        title="Orçamentos Pendentes"
                        value={stats?.orcamentosPendentes || 0}
                        icon={DollarSign}
                        colorClass="text-red-400"
                    />
                    <AdminStatsCard
                        title="Serviços em Dev"
                        value={stats?.servicosEmDesenvolvimento || 0}
                        icon={Briefcase}
                        colorClass="text-blue-400"
                    />
                </div>
            )}

            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas de Gestão</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link href="/clientes" className="bg-purple-600 p-4 rounded-lg text-white font-semibold hover:bg-purple-700 transition flex items-center justify-center">
                        <Users size={20} className="mr-2" /> Ver Clientes
                    </Link>
                    <Link href="/chamados" className="bg-yellow-600 p-4 rounded-lg text-white font-semibold hover:bg-yellow-700 transition flex items-center justify-center">
                        <MessageSquare size={20} className="mr-2" /> Responder Chamados
                    </Link>
                    <Link href="/admin/orcamentos/novo" className="bg-green-600 p-4 rounded-lg text-white font-semibold hover:bg-green-700 transition flex items-center justify-center">
                        <DollarSign size={20} className="mr-2" /> Criar Orçamento
                    </Link>
                    {isAdmin && (
                        <Link href="/admin/invite-employee" className="bg-blue-600 p-4 rounded-lg text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center">
                            <UserPlus size={20} className="mr-2" /> Convidar Equipe
                        </Link>
                    )}
                </div>
            </div>
        </PainelLayout>
    );
}
