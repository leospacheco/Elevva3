// src/app/(painel)/admin/servicos/novo/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Briefcase, Link as LinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrcamentoStatus, ServicoStatus } from '@/types/app';

// Tipagem para um cliente/orcamento simples (usado para o Select)
interface Cliente {
    id: string;
    nome: string;
    email: string;
}

interface OrcamentoAprovado {
    id: string;
    titulo: string;
    cliente_id: string;
    valor_total: number;
    cliente: {
        nome: string;
        email: string;
    };
}

const servicoStatusMap: Record<ServicoStatus, string> = {
    0: 'Aberto',
    1: 'Em Desenvolvimento',
    2: 'Em Teste',
    3: 'Concluído',
};

export default function NovoServicoPage() {
    const { profile, isEmployee } = useAuth();
    const router = useRouter();

    const [nomeServico, setNomeServico] = useState('');
    const [clienteId, setClienteId] = useState<string>('');
    const [orcamentoId, setOrcamentoId] = useState<string | ''>('');
    const [observacoes, setObservacoes] = useState('');

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [orcamentosAprovados, setOrcamentosAprovados] = useState<OrcamentoAprovado[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAuthorized = profile?.role === 2 || profile?.role === 1; // Admin ou Funcionário

    // --- Lógica de Clientes e Orçamentos Aprovados ---
    const fetchDadosIniciais = useCallback(async () => {
        if (!isAuthorized) return;
        setLoading(true);

        // 1. Buscar todos os clientes
        const { data: clientesData } = await supabase
            .from('profiles')
            .select('id, nome, email')
            .eq('role', 0)
            .order('nome', { ascending: true });

        // 2. Buscar orçamentos APROVADOS (status: 1) para vincular
        const { data: orcamentosData } = await supabase
            .from('orcamentos')
            .select(`
                id,
                titulo,
                cliente_id,
                valor_total,
                cliente:cliente_id (nome, email)
            `)
            .eq('status', 1); // 1: Aprovado

        if (clientesData) {
            setClientes(clientesData as Cliente[]);
            if (clientesData.length > 0) {
                setClienteId(clientesData[0].id); // Seleciona o primeiro cliente por padrão
            }
        }

        if (orcamentosData) {
            setOrcamentosAprovados(orcamentosData as any as OrcamentoAprovado[]);
        }

        setLoading(false);
    }, [isAuthorized]);

    useEffect(() => {
        if (isAuthorized) {
            fetchDadosIniciais();
        }
    }, [isAuthorized, fetchDadosIniciais]);

    // --- Lógica de Submissão ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!clienteId) {
            toast.error('Selecione um cliente para o serviço.');
            return;
        }

        setIsSubmitting(true);

        const { error } = await supabase.from('servicos').insert({
            cliente_id: clienteId,
            nome_servico: nomeServico,
            observacoes,
            orcamento_id: orcamentoId || null, // Opcional
            status: 0, // 0: Aberto (inicial)
        });

        if (error) {
            toast.error(`Erro ao iniciar serviço: ${error.message}`);
        } else {
            toast.success('Serviço iniciado com sucesso! O cliente foi notificado.');
            // Redireciona para a lista de serviços (Admin)
            router.push('/servicos');
        }
        setIsSubmitting(false);
    };

    // Acesso negado
    if (!isAuthorized) {
        return (
            <PainelLayout>
                <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                    <h1 className="text-3xl font-extrabold mb-4">Acesso Restrito</h1>
                    <p>Você não tem permissão para iniciar novos serviços.</p>
                </div>
            </PainelLayout>
        );
    }

    return (
        <PainelLayout>
            <div className="max-w-4xl mx-auto">
                <Link href="/servicos" className="flex items-center text-gray-400 hover:text-white transition mb-6">
                    <ArrowLeft size={16} className="mr-2" /> Voltar para Serviços
                </Link>
                <h1 className="text-3xl font-extrabold text-white mb-6 flex items-center">
                    <Briefcase size={32} className='mr-3 text-blue-400' /> Iniciar Novo Serviço
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-blue-400">
                        <Loader2 className="animate-spin mr-2" size={24} /> Carregando dados...
                    </div>
                ) : clientes.length === 0 ? (
                    <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                        <p>É necessário cadastrar clientes (role 0) para iniciar um serviço.</p>
                        <Link href="/register" className='text-blue-400 font-semibold mt-2 block'>
                            Ir para Registro
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Seção de Dados Principais */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Detalhes do Projeto</h2>

                            <div>
                                <label htmlFor="cliente" className="block text-sm font-medium text-gray-300">Cliente</label>
                                <select id="cliente" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="nomeServico" className="block text-sm font-medium text-gray-300">Nome do Serviço/Projeto</label>
                                <input type="text" id="nomeServico" required value={nomeServico} onChange={(e) => setNomeServico(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ex: Novo Site Institucional V.2"
                                />
                            </div>

                            {/* Vínculo com Orçamento Aprovado */}
                            {orcamentosAprovados.length > 0 && (
                                <div>
                                    <label htmlFor="orcamento" className="block text-sm font-medium text-gray-300 flex items-center">
                                        <LinkIcon size={16} className='mr-2' /> Vincular a Orçamento Aprovado (Opcional)
                                    </label>
                                    <select id="orcamento" value={orcamentoId} onChange={(e) => setOrcamentoId(e.target.value)}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">-- Nenhum Orçamento (Projeto Novo) --</option>
                                        {orcamentosAprovados.filter(o => o.cliente_id === clienteId).map(o => (
                                            <option key={o.id} value={o.id}>{o.titulo} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.valor_total)}</option>
                                        ))}
                                    </select>
                                    <p className='text-xs text-gray-500 mt-1'>Apenas orçamentos aprovados para o cliente selecionado.</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-300">Observações / Escopo Inicial</label>
                                <textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Detalhes adicionais, requisitos iniciais, prazos."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || !nomeServico || !clienteId}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-md text-lg font-bold transition ${isSubmitting || !nomeServico || !clienteId
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Iniciar Serviço e Notificar Cliente'}
                        </button>
                    </form>
                )}
            </div>
        </PainelLayout>
    );
}
