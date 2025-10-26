// src/app/(painel)/servicos/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Servico, ServicoStatus } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, Briefcase, ArrowRight, User, Clock, Package } from 'lucide-react';
import { ListHeader } from '@/components/common/ListHeader';
import Link from 'next/link';

// CORREÇÃO DE TIPAGEM: Usamos Omit para remover a propriedade 'cliente' da interface Servico base
// e redefinimos o tipo para o JOIN do Supabase.
interface ServicoComProfile extends Omit<Servico, 'cliente'> {
    cliente: {
        nome: string | null;
        email: string;
    } | null;
}

const statusMap: Record<ServicoStatus, { label: string; color: string }> = {
    0: { label: 'Aberto', color: 'bg-blue-500/20 text-blue-400 border-blue-500' },
    1: { label: 'Em Desenvolvimento', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500' },
    2: { label: 'Em Teste', color: 'bg-purple-500/20 text-purple-400 border-purple-500' },
    3: { label: 'Concluído', color: 'bg-green-500/20 text-green-400 border-green-500' },
};

export default function ServicosPage() {
    const { profile, isEmployee } = useAuth();
    // Usa a interface com o perfil aninhado para o estado
    const [servicos, setServicos] = useState<ServicoComProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchServicos = useCallback(async () => {
        if (!profile) return;
        setLoading(true);

        // Seleciona explicitamente todas as colunas obrigatórias
        let query = supabase
            .from('servicos')
            .select(`
                id,
                nome_servico,
                status,
                created_at,
                cliente:cliente_id (nome, email)
            `)
            .order('created_at', { ascending: false });

        // Cliente só vê os seus próprios serviços
        if (!isEmployee) {
            query = query.eq('cliente_id', profile.id);
        }

        const { data, error } = await query;

        if (error) {
            toast.error('Erro ao carregar serviços.');
            console.error('Erro ao buscar serviços:', error);
        } else {
            // Conversão forçada: O 'as any as ServicoComProfile[]' resolve os problemas de tipagem persistentes.
            setServicos(data as any as ServicoComProfile[]);
        }

        setLoading(false);
    }, [profile, isEmployee]);

    useEffect(() => {
        // Garante que profile?.id existe antes de tentar buscar
        if (profile?.id) {
            fetchServicos();
        }
    }, [profile?.id, isEmployee, fetchServicos]);

    const headerTitle = isEmployee ? 'Gerenciar Serviços/Projetos' : 'Meus Serviços em Andamento';
    const headerDescription = isEmployee
        ? 'Acompanhe todos os projetos em desenvolvimento, altere o status e adicione observações.'
        : 'Veja o status atual de seus projetos (sites e web apps) com a Elevva web.';

    return (
        <PainelLayout>
            <ListHeader
                title={headerTitle}
                description={headerDescription}
                // Rota de criação para Admin/Funcionário será em /admin/servicos/novo (Fase 6)
                buttonText={isEmployee ? 'Iniciar Novo Serviço' : undefined}
                buttonHref={isEmployee ? '/admin/servicos/novo' : undefined}
            />

            {loading && (
                <div className="flex justify-center items-center h-40 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Carregando Serviços...
                </div>
            )}

            {!loading && servicos.length === 0 && (
                <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Nenhum serviço em andamento.</p>
                </div>
            )}

            {!loading && servicos.length > 0 && (
                <div className="space-y-4">
                    {servicos.map((servico) => {
                        const statusDetails = statusMap[servico.status];

                        return (
                            <div key={servico.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex justify-between items-start transition hover:border-blue-500/50">
                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold text-white truncate mb-1">{servico.nome_servico}</p>

                                    <p className="text-xs text-gray-500 flex items-center mt-1">
                                        <Clock size={12} className="mr-1" />
                                        Iniciado em: {new Date(servico.created_at).toLocaleDateString('pt-BR')}
                                    </p>

                                    {/* Exibe o Cliente apenas para Funcionário/Admin */}
                                    {isEmployee && servico.cliente && (
                                        <p className="text-sm text-gray-400 mt-2 flex items-center space-x-2">
                                            <User size={16} className='text-green-500' />
                                            <span>Cliente: <span className="font-semibold text-white">{servico.cliente.nome || servico.cliente.email}</span></span>
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex flex-col items-end mx-4 flex-shrink-0">
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full border ${statusDetails.color}`}>
                                        {statusDetails.label}
                                    </span>
                                </div>

                                {/* Botão de Detalhes */}
                                <Link
                                    href={`/servicos/${servico.id}`}
                                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition flex-shrink-0 ml-4"
                                    title="Ver Detalhes"
                                >
                                    <ArrowRight size={20} />
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </PainelLayout>
    );
}
