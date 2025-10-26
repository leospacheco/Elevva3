// src/app/(painel)/chamados/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Chamado, ChamadoStatus, Profile } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, MessageSquare, ArrowRight, User } from 'lucide-react';
import { ListHeader } from '@/components/common/ListHeader';
import Link from 'next/link';

// Usamos esta interface auxiliar para o fetch, pois o JOIN do Supabase
// causa problemas de tipagem com a interface base Chamado (Next.js/TS bug)
interface ChamadoComProfile extends Omit<Chamado, 'profiles'> {
    profiles: {
        nome: string | null;
        email: string;
    } | null;
}

const statusMap: Record<ChamadoStatus, { label: string; color: string }> = {
    0: { label: 'Aberto', color: 'bg-red-500/20 text-red-400 border-red-500' },
    1: { label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500' },
    2: { label: 'Fechado', color: 'bg-green-500/20 text-green-400 border-green-500' },
};

export default function ChamadosPage() {
    const { profile, isEmployee } = useAuth();
    // Usa a interface com o perfil aninhado para o estado
    const [chamados, setChamados] = useState<ChamadoComProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchChamados = useCallback(async () => {
        if (!profile) return;
        setLoading(true);

        // Seleciona explicitamente todas as colunas obrigatórias
        let query = supabase
            .from('chamados')
            .select(`
                id,
                titulo,
                descricao,
                cliente_id,
                status,
                prioridade,
                created_at,
                profiles:cliente_id (nome, email)
            `)
            .order('created_at', { ascending: false });

        // Cliente só vê os seus próprios chamados
        if (!isEmployee) {
            query = query.eq('cliente_id', profile.id);
        }

        const { data, error } = await query;

        if (error) {
            toast.error('Erro ao carregar chamados.');
            console.error('Erro ao buscar chamados:', error);
        } else {
            // Conversão forçada: Mapeamos os dados brutos para o tipo correto.
            // O uso de 'as any as ChamadoComProfile[]' resolve os problemas de tipagem persistentes.
            setChamados(data as any as ChamadoComProfile[]);
        }

        setLoading(false);
    }, [profile, isEmployee]);

    useEffect(() => {
        fetchChamados();
    }, [profile?.id, isEmployee, fetchChamados]); // Passa as dependências corretas (profile.id e isEmployee)

    const headerTitle = isEmployee ? 'Gerenciar Chamados' : 'Meus Chamados';
    const headerDescription = isEmployee
        ? 'Visualize todos os tickets abertos pelos clientes. Clique para responder.'
        : 'Acompanhe o status e converse com nossa equipe sobre suas solicitações.';

    return (
        <PainelLayout>
            <ListHeader
                title={headerTitle}
                description={headerDescription}
                buttonText={isEmployee ? undefined : 'Abrir Novo Chamado'}
                buttonHref={isEmployee ? undefined : '/chamados/novo'}
            />

            {loading && (
                <div className="flex justify-center items-center h-40 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Carregando Chamados...
                </div>
            )}

            {!loading && chamados.length === 0 && (
                <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Nenhum chamado encontrado.</p>
                </div>
            )}

            {!loading && chamados.length > 0 && (
                <div className="space-y-4">
                    {chamados.map((chamado) => {
                        const statusDetails = statusMap[chamado.status];

                        return (
                            <div key={chamado.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex justify-between items-start transition hover:border-blue-500/50">
                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold text-white truncate mb-1">{chamado.titulo}</p>
                                    <p className="text-sm text-gray-400 mb-2">{chamado.descricao || 'Sem descrição'}</p>

                                    <p className="text-xs text-gray-500 flex items-center">
                                        <MessageSquare size={12} className="mr-1" />
                                        Aberto em: {new Date(chamado.created_at).toLocaleDateString('pt-BR')}
                                    </p>

                                    {/* Exibe o Cliente apenas para Funcionário/Admin */}
                                    {isEmployee && chamado.profiles && (
                                        <p className="text-sm text-gray-400 mt-2 flex items-center space-x-2">
                                            <User size={16} className='text-green-500' />
                                            <span>Cliente: <span className="font-semibold text-white">{chamado.profiles.nome || chamado.profiles.email}</span></span>
                                        </p>
                                    )}
                                </div>

                                {/* Status e Prioridade */}
                                <div className="flex flex-col items-end mx-4 flex-shrink-0">
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full border ${statusDetails.color} mb-2`}>
                                        {statusDetails.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Prioridade: <span className="capitalize">{chamado.prioridade}</span>
                                    </span>
                                </div>

                                {/* Botão de Ação */}
                                <Link
                                    href={`/chamados/${chamado.id}`}
                                    className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition flex-shrink-0 ml-4"
                                    title={isEmployee ? "Responder Chamado" : "Ver Conversa"}
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
