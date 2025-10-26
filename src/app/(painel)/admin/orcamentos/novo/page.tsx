// src/app/(painel)/admin/orcamentos/novo/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Loader2, Plus, ArrowLeft, Trash2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ServicoStatus } from '@/types/app';

// Tipagem para um item da lista de detalhes do orçamento
interface OrcamentoItem {
    id: number;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
}

// Tipagem para um cliente simples (usado para o Select)
interface Cliente {
    id: string;
    nome: string;
    email: string;
}

export default function NovoOrcamentoPage() {
    const { profile, isEmployee } = useAuth();
    const router = useRouter();

    const [titulo, setTitulo] = useState('');
    const [clienteId, setClienteId] = useState<string>('');
    const [observacoes, setObservacoes] = useState('');
    const [listaItens, setListaItens] = useState<OrcamentoItem[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAuthorized = profile?.role === 2 || profile?.role === 1; // Admin ou Funcionário

    // --- Lógica de Clientes ---
    const fetchClientes = useCallback(async () => {
        if (!isAuthorized) return;
        setLoading(true);

        // 1. Buscar todos os clientes (role: 0)
        // OBS: Se esta consulta retornar vazia com clientes cadastrados,
        // o problema está na política RLS (Row Level Security) do Supabase.
        const { data: clientesData, error } = await supabase
            .from('profiles')
            .select('id, nome, email')
            .eq('role', 0)
            .order('nome', { ascending: true });

        if (error) {
            toast.error('Erro ao carregar lista de clientes. Verifique a RLS.');
            console.error('Erro RLS/Fetch Clientes:', error);
            setClientes([]);
        } else if (clientesData) {
            setClientes(clientesData as Cliente[]);
            if (clientesData.length > 0) {
                setClienteId(clientesData[0].id); // Seleciona o primeiro cliente por padrão
            }
        }
        setLoading(false);
    }, [isAuthorized]);

    useEffect(() => {
        if (isAuthorized) {
            fetchClientes();
        }
    }, [isAuthorized, fetchClientes]);

    // --- Lógica de Itens do Orçamento ---

    const addNewItem = () => {
        setListaItens(prev => [
            ...prev,
            { id: Date.now(), descricao: '', quantidade: 1, valor_unitario: 0, subtotal: 0 }
        ]);
    };

    const updateItem = (id: number, field: keyof Omit<OrcamentoItem, 'id' | 'subtotal'>, value: string | number) => {
        setListaItens(prev => prev.map(item => {
            if (item.id === id) {
                // Se for descrição, use o valor string; senão, use o valor numérico
                const val = typeof value === 'string' && field !== 'descricao' ? parseFloat(value) || 0 : value;

                const updatedItem = { ...item, [field]: val };
                // Garante que quantidade e valor unitário são tratados como números para o cálculo
                const quantidade = typeof updatedItem.quantidade === 'number' ? updatedItem.quantidade : parseFloat(updatedItem.quantidade as string) || 0;
                const valor_unitario = typeof updatedItem.valor_unitario === 'number' ? updatedItem.valor_unitario : parseFloat(updatedItem.valor_unitario as string) || 0;

                updatedItem.subtotal = quantidade * valor_unitario;
                return updatedItem;
            }
            return item;
        }));
    };

    const removeItem = (id: number) => {
        setListaItens(prev => prev.filter(item => item.id !== id));
    };

    const totalOrcamento = listaItens.reduce((sum, item) => sum + item.subtotal, 0);

    // --- Lógica de Submissão ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (listaItens.length === 0) {
            toast.error('Adicione pelo menos um item ao orçamento.');
            return;
        }
        if (!clienteId) {
            toast.error('Selecione um cliente para o orçamento.');
            return;
        }

        setIsSubmitting(true);

        const detalhesParaDB = listaItens.map(item => ({
            descricao: item.descricao,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            subtotal: item.subtotal
        }));

        const { error } = await supabase.from('orcamentos').insert({
            cliente_id: clienteId,
            titulo,
            detalhes: detalhesParaDB, // JSONB
            valor_total: totalOrcamento,
            observacoes,
            criado_por: profile?.id, // ID do Admin/Funcionário
            status: 0, // 0: Pendente (inicial)
        });

        if (error) {
            toast.error(`Erro ao criar orçamento: ${error.message}`);
        } else {
            toast.success('Orçamento criado e enviado para o cliente!');
            // Redireciona para a lista de orçamentos (Admin)
            router.push('/orcamentos');
        }
        setIsSubmitting(false);
    };

    // Acesso negado
    if (!isAuthorized) {
        return (
            <PainelLayout>
                <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                    <h1 className="text-3xl font-extrabold mb-4">Acesso Restrito</h1>
                    <p>Você não tem permissão para criar orçamentos.</p>
                </div>
            </PainelLayout>
        );
    }

    return (
        <PainelLayout>
            <div className="max-w-4xl mx-auto">
                <Link href="/orcamentos" className="flex items-center text-gray-400 hover:text-white transition mb-6">
                    <ArrowLeft size={16} className="mr-2" /> Voltar para Orçamentos
                </Link>
                <h1 className="text-3xl font-extrabold text-white mb-6 flex items-center">
                    <DollarSign size={32} className='mr-3 text-green-400' /> Criar Novo Orçamento
                </h1>

                {loading ? (
                    <div className="flex justify-center items-center h-64 text-blue-400">
                        <Loader2 className="animate-spin mr-2" size={24} /> Carregando clientes...
                    </div>
                ) : clientes.length === 0 ? (
                    <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                        <p>É necessário cadastrar clientes (role 0) para criar um orçamento.</p>
                        {/* CORREÇÃO DE LINK: Aponta para a página de Registro, onde a role 0 é criada */}
                        <Link href="/register" className='text-blue-400 font-semibold mt-2 block'>
                            Ir para Registro de Cliente
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Seção de Dados Principais */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Informações Básicas</h2>

                            <div>
                                <label htmlFor="cliente" className="block text-sm font-medium text-gray-300">Cliente Destino</label>
                                <select id="cliente" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="titulo" className="block text-sm font-medium text-gray-300">Título do Orçamento (Ex: Desenvolvimento de E-commerce)</label>
                                <input type="text" id="titulo" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nome resumido do projeto"
                                />
                            </div>

                            <div>
                                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-300">Observações / Termos</label>
                                <textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)}
                                    rows={4}
                                    className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Condições, validade, escopo resumido, etc."
                                />
                            </div>
                        </div>

                        {/* Seção de Detalhes do Orçamento */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                            <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2 mb-4">Itens e Valores</h2>

                            <div className="space-y-4">
                                {listaItens.map((item, index) => (
                                    <div key={item.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex flex-col md:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full">
                                            <label className="block text-sm font-medium text-gray-300">Descrição do Item</label>
                                            <input type="text" required value={item.descricao} onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                                placeholder="Ex: Licença de Hospedagem (1 ano)"
                                            />
                                        </div>

                                        <div className="w-full md:w-20">
                                            <label className="block text-sm font-medium text-gray-300">Qtd</label>
                                            <input type="number" required value={item.quantidade} onChange={(e) => updateItem(item.id, 'quantidade', e.target.value)}
                                                min="1"
                                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                            />
                                        </div>

                                        <div className="w-full md:w-32">
                                            <label className="block text-sm font-medium text-gray-300">V. Unitário (R$)</label>
                                            <input type="number" required value={item.valor_unitario} onChange={(e) => updateItem(item.id, 'valor_unitario', e.target.value)}
                                                min="0" step="0.01"
                                                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                            />
                                        </div>

                                        <div className="w-full md:w-24 text-right">
                                            <p className="text-sm text-gray-400">Subtotal</p>
                                            <p className="text-white font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}</p>
                                        </div>

                                        <button type="button" onClick={() => removeItem(item.id)} className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex-shrink-0 w-full md:w-auto">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button type="button" onClick={addNewItem} className="flex items-center text-blue-400 hover:text-blue-300 transition mt-4">
                                <Plus size={16} className="mr-2" /> Adicionar Novo Item
                            </button>

                            <div className="text-right pt-4 border-t border-gray-700 mt-4">
                                <span className="text-xl font-bold text-white">Valor Total: </span>
                                <span className="text-3xl font-extrabold text-green-400 ml-4">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalOrcamento)}
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting || listaItens.length === 0}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-md text-lg font-bold transition ${isSubmitting || listaItens.length === 0
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Salvar e Enviar Orçamento'}
                        </button>
                    </form>
                )}
            </div>
        </PainelLayout>
    );
}