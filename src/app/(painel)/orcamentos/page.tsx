// src/app/(painel)/orcamentos/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Orcamento, OrcamentoStatus } from '@/types/app';
import toast from 'react-hot-toast';
// CORREÇÃO DE IMPORTAÇÃO: Adicionar Check e X
import { Loader2, DollarSign, ArrowRight, User, Clock, Check, X } from 'lucide-react';
import { ListHeader } from '@/components/common/ListHeader';
import Link from 'next/link';

// CORREÇÃO FINAL DE TIPAGEM: Usamos Omit para remover o campo 'cliente' da interface Orcamento base
// e redefinimos o tipo para o JOIN do Supabase.
interface OrcamentoComProfile extends Omit<Orcamento, 'cliente'> {
    // Definimos o cliente como o tipo retornado pelo JOIN
    cliente: {
        nome: string | null;
        email: string;
    } | null;
}

const statusMap: Record<OrcamentoStatus, { label: string; color: string }> = {
    0: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500' },
    1: { label: 'Aprovado', color: 'bg-green-500/20 text-green-400 border-green-500' },
    2: { label: 'Rejeitado', color: 'bg-red-500/20 text-red-400 border-red-500' },
    3: { label: 'Cancelado', color: 'bg-gray-500/20 text-gray-400 border-gray-500' },
};

// Helper para formatar o valor (simples)
const formatCurrency = (value: number) => {
    // Garante que o valor não é nulo antes de formatar
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};


export default function OrcamentosPage() {
    const { profile, isEmployee } = useAuth();
    // Usa a interface com o perfil aninhado para o estado
    const [orcamentos, setOrcamentos] = useState<OrcamentoComProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrcamentos = useCallback(async () => {
        if (!profile) return;
        setLoading(true);

        // Seleciona explicitamente todas as colunas obrigatórias
        let query = supabase
            .from('orcamentos')
            .select(`
                id,
                titulo,
                valor_total,
                status,
                created_at,
                cliente:cliente_id (nome, email)
            `)
            .order('created_at', { ascending: false });

        // Cliente só vê os seus próprios orçamentos
        if (!isEmployee) {
            query = query.eq('cliente_id', profile.id);
        }

        const { data, error } = await query;

        if (error) {
            toast.error('Erro ao carregar orçamentos.');
            console.error('Erro ao buscar orçamentos:', error);
        } else {
            // Conversão forçada: O 'as any as OrcamentoComProfile[]' resolve os problemas de tipagem persistentes.
            setOrcamentos(data as any as OrcamentoComProfile[]);
        }

        setLoading(false);
    }, [profile, isEmployee]);

    useEffect(() => {
        // CORREÇÃO: Garante que profile?.id existe antes de tentar buscar
        if (profile?.id) {
            fetchOrcamentos();
        }
    }, [profile?.id, isEmployee, fetchOrcamentos]);

    const headerTitle = isEmployee ? 'Gerenciar Orçamentos' : 'Meus Orçamentos';
    const headerDescription = isEmployee
        ? 'Gerencie, crie e acompanhe o status de aprovação de todos os orçamentos.'
        : 'Visualize os orçamentos enviados, aprove ou rejeite propostas.';

    return (
        <PainelLayout>
            <ListHeader
                title={headerTitle}
                description={headerDescription}
                // Rota de criação para Admin/Funcionário será em /admin/orcamentos/novo (Fase 6)
                buttonText={isEmployee ? 'Criar Novo Orçamento' : undefined}
                buttonHref={isEmployee ? '/admin/orcamentos/novo' : undefined}
            />

            {loading && (
                <div className="flex justify-center items-center h-40 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Carregando Orçamentos...
                </div>
            )}

            {!loading && orcamentos.length === 0 && (
                <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Nenhum orçamento encontrado.</p>
                </div>
            )}

            {!loading && orcamentos.length > 0 && (
                <div className="space-y-4">
                    {orcamentos.map((orcamento) => {
                        const statusDetails = statusMap[orcamento.status];
                        const isPending = orcamento.status === 0;

                        return (
                            <div key={orcamento.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex justify-between items-start transition hover:border-blue-500/50">
                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold text-white truncate mb-1">{orcamento.titulo}</p>

                                    {isEmployee && orcamento.cliente && (
                                        <p className="text-sm text-gray-400 mt-2 flex items-center space-x-2">
                                            <User size={16} className='text-green-500' />
                                            <span>Cliente: <span className="font-semibold text-white">{orcamento.cliente.nome || orcamento.cliente.email}</span></span>
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 flex items-center mt-2">
                                        <Clock size={12} className="mr-1" />
                                        Criado em: {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {/* Valor e Status */}
                                <div className="flex flex-col items-end mx-4 flex-shrink-0">
                                    <span className="text-2xl font-extrabold text-green-400">
                                        {formatCurrency(orcamento.valor_total || 0)}
                                    </span>
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full border mt-2 ${statusDetails.color}`}>
                                        {statusDetails.label}
                                    </span>
                                </div>

                                {/* Ações do Cliente */}
                                {!isEmployee && isPending && (
                                    <div className="flex space-x-2 ml-4">
                                        {/* Lógica de Aprovar/Rejeitar será implementada no próximo passo (Fase 6) */}
                                        <button className="p-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition" title="Aprovar Orçamento">
                                            <Check size={20} />
                                        </button>
                                        <button className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 transition" title="Rejeitar Orçamento">
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}

                                {/* Botão de Detalhes */}
                                <Link
                                    href={`/orcamentos/${orcamento.id}`}
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
