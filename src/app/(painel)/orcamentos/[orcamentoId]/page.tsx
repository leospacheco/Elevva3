// src/app/(painel)/orcamentos/[orcamentoId]/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Orcamento, OrcamentoStatus } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, DollarSign, ArrowLeft, Check, X, Calendar, User, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Tipagem aninhada (resolvendo o problema de ORCAMENTOS)
// CORREÇÃO: Definimos OrcamentoDetalhe com as colunas que o SELECT retorna explicitamente,
// sem depender de extends ou Omit, para resolver o conflito de tipos aninhados.
interface OrcamentoDetalhe {
    id: string;
    titulo: string;
    valor_total: number;
    status: OrcamentoStatus;
    created_at: string;
    observacoes: string | null;

    // Detalhes do JSONB
    detalhes: {
        descricao: string;
        quantidade: number;
        valor_unitario: number;
        subtotal: number;
    }[];

    // Tipos das colunas aninhadas (JOINs)
    cliente: { nome: string | null; email: string; } | null;
    criador: { nome: string | null; } | null;
}

const statusMap: Record<OrcamentoStatus, { label: string; color: string }> = {
    0: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500' },
    1: { label: 'Aprovado', color: 'text-green-400 bg-green-500/20 border-green-500' },
    2: { label: 'Rejeitado', color: 'text-red-400 bg-red-500/20 border-red-500' },
    3: { label: 'Cancelado', color: 'text-gray-400 bg-gray-500/20 border-gray-500' },
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Opções para o select de status (apenas para Admin/Funcionário)
const statusOptions = [
    { value: 0, label: 'Pendente' },
    { value: 1, label: 'Aprovado' },
    { value: 2, label: 'Rejeitado' },
    { value: 3, label: 'Cancelado' },
];

export default function OrcamentoDetalhePage() {
    const { profile, isEmployee, isClient } = useAuth();
    const params = useParams();
    const router = useRouter();
    const orcamentoId = params.orcamentoId as string;

    // HACK: Usamos 'as OrcamentoDetalhe | null' para o useState
    const [orcamento, setOrcamento] = useState<OrcamentoDetalhe | null>(null as OrcamentoDetalhe | null);
    const [loading, setLoading] = useState(true);
    const [statusSelecionado, setStatusSelecionado] = useState<OrcamentoStatus>(0);
    const [observacaoInterna, setObservacaoInterna] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOrcamento = useCallback(async () => {
        if (!orcamentoId || !profile) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('orcamentos')
            .select(`
                id, titulo, valor_total, status, created_at, observacoes,
                detalhes,
                cliente:cliente_id (nome, email),
                criador:criado_por (nome)
            `)
            .eq('id', orcamentoId)
            // RLS garante que o cliente_id = auth.uid()
            .single();

        if (error) {
            toast.error('Erro ao carregar orçamento ou Acesso negado.');
            router.push('/orcamentos');
            return;
        }

        if (data) {
            // CORREÇÃO FINAL: Usamos 'as any as OrcamentoDetalhe' para forçar a compatibilidade
            setOrcamento(data as any as OrcamentoDetalhe);
            setStatusSelecionado(data.status);
            setObservacaoInterna(data.observacoes || '');
        }

        setLoading(false);
    }, [orcamentoId, profile, router]);

    useEffect(() => {
        fetchOrcamento();
    }, [fetchOrcamento]);

    // Ações do Cliente (Aprovar/Rejeitar)
    const handleClienteAcao = async (novoStatus: 1 | 2) => {
        if (!orcamento || orcamento.status !== 0) return; // Só pode agir se Pendente

        setIsUpdating(true);
        const { error } = await supabase
            .from('orcamentos')
            .update({ status: novoStatus })
            .eq('id', orcamento.id);

        if (error) {
            toast.error('Falha ao registrar sua decisão.');
        } else {
            toast.success(novoStatus === 1 ? 'Orçamento APROVADO com sucesso!' : 'Orçamento REJEITADO.');
            fetchOrcamento(); // Recarrega para mostrar o novo status
        }
        setIsUpdating(false);
    };

    // Ações do Admin/Funcionário (Alterar Status/Obs)
    const handleAdminUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orcamento || !isEmployee) return;

        setIsUpdating(true);
        const { error } = await supabase
            .from('orcamentos')
            .update({
                status: statusSelecionado,
                observacoes: observacaoInterna
            })
            .eq('id', orcamento.id);

        if (error) {
            toast.error('Falha ao atualizar orçamento.');
        } else {
            toast.success('Orçamento atualizado!');
            fetchOrcamento();
        }
        setIsUpdating(false);
    };


    if (loading) {
        return <PainelLayout><div className="flex justify-center p-10 text-blue-400"><Loader2 className="animate-spin mr-2" size={24} /> Carregando detalhes...</div></PainelLayout>;
    }

    if (!orcamento) {
        return <PainelLayout><div className="text-red-400 p-10">Orçamento não encontrado ou acesso restrito.</div></PainelLayout>;
    }

    const statusDetalhes = statusMap[orcamento.status];
    const isPending = orcamento.status === 0;

    return (
        <PainelLayout>
            <div className="max-w-6xl mx-auto">
                <Link href="/orcamentos" className="flex items-center text-gray-400 hover:text-white transition mb-6">
                    <ArrowLeft size={16} className="mr-2" /> Voltar para a Lista de Orçamentos
                </Link>

                <header className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-white mb-2">{orcamento.titulo}</h1>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                        <span className={`font-semibold py-1 px-3 rounded-full border ${statusDetalhes.color} border`}>
                            {statusDetalhes.label}
                        </span>
                        <p className="flex items-center"><Calendar size={14} className="mr-1" /> Criado em: {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}</p>
                        {orcamento.cliente && (
                            <p className="flex items-center"><User size={14} className="mr-1" /> Cliente: {orcamento.cliente.nome || orcamento.cliente.email}</p>
                        )}
                        {orcamento.criador && isEmployee && (
                            <p className="flex items-center"><FileText size={14} className="mr-1" /> Criado por: {orcamento.criador.nome}</p>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Principal: Detalhes e Ações */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Seção de Itens */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Detalhes do Serviço</h2>

                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Descrição</th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-16">Qtd.</th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-24">V. Unit.</th>
                                        <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider w-24">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {orcamento.detalhes.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-700/50">
                                            <td className="px-3 py-3 whitespace-normal text-sm text-gray-300">{item.descricao}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-400 text-right">{item.quantidade}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-400 text-right">{formatCurrency(item.valor_unitario)}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-white text-right">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="text-right pt-4 mt-4 border-t border-gray-700">
                                <span className="text-xl font-bold text-white">Valor Total: </span>
                                <span className="text-3xl font-extrabold text-green-400 ml-4">
                                    {formatCurrency(orcamento.valor_total || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Seção de Observações (Cliente/Admin) */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4">Observações e Termos</h2>
                            <p className="text-gray-400 whitespace-pre-wrap">{orcamento.observacoes || 'Nenhuma observação ou termo adicional foi fornecido neste orçamento.'}</p>
                        </div>
                    </div>

                    {/* Coluna Lateral: Status e Ações */}
                    <div className="lg:col-span-1 space-y-8">

                        {/* Ações do Cliente */}
                        {isClient && isPending && (
                            <div className="bg-blue-900/40 p-6 rounded-xl border border-blue-600 space-y-4">
                                <h2 className="text-xl font-bold text-white">Sua Decisão</h2>
                                <p className='text-gray-300'>Este orçamento está pendente de sua aprovação.</p>
                                <div className='flex space-x-3'>
                                    <button
                                        onClick={() => handleClienteAcao(1)} // Aprovar
                                        disabled={isUpdating}
                                        className="flex-1 flex items-center justify-center py-2 px-4 rounded-md text-white font-bold transition bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                                    >
                                        {isUpdating ? <Loader2 size={20} className='animate-spin' /> : <><Check size={20} className="mr-2" /> Aprovar</>}
                                    </button>
                                    <button
                                        onClick={() => handleClienteAcao(2)} // Rejeitar
                                        disabled={isUpdating}
                                        className="flex-1 flex items-center justify-center py-2 px-4 rounded-md text-white font-bold transition bg-red-600 hover:bg-red-700 disabled:bg-gray-500"
                                    >
                                        {isUpdating ? <Loader2 size={20} className='animate-spin' /> : <><X size={20} className="mr-2" /> Rejeitar</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Ações do Admin/Funcionário */}
                        {isEmployee && (
                            <form onSubmit={handleAdminUpdate} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                                <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Gerenciamento Interno</h2>

                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-300">Alterar Status</label>
                                    <select
                                        id="status"
                                        required
                                        value={statusSelecionado}
                                        onChange={(e) => setStatusSelecionado(parseInt(e.target.value) as OrcamentoStatus)}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="obsInterna" className="block text-sm font-medium text-gray-300">Observação Interna (Admin)</label>
                                    <textarea id="obsInterna" value={observacaoInterna} onChange={(e) => setObservacaoInterna(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Notas internas sobre o projeto/negociação."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-bold transition ${isUpdating
                                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                        }`}
                                >
                                    {isUpdating ? <Loader2 size={20} className='animate-spin mr-2' /> : 'Atualizar Orçamento'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

            </div>
        </PainelLayout>
    );
}
