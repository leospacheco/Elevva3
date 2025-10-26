// src/app/(painel)/servicos/[servicoId]/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ServicoStatus } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Briefcase, Calendar, User, FileText, Code, CheckCircle, DollarSign } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// CORREÇÃO FINAL DE TIPAGEM:
// Definimos explicitamente todos os campos retornados pela query,
// eliminando a herança de 'Servico' para evitar conflitos de tipagem de JOINs.
interface ServicoDetalhe {
    id: string;
    nome_servico: string;
    status: ServicoStatus;
    observacoes: string | null;
    created_at: string;
    progresso_cliente: string | null; // Campo de progresso visível ao cliente
    
    // Colunas aninhadas (JOINs)
    cliente: { nome: string | null; email: string; } | null;
    orcamento: { titulo: string } | null;
}

const statusMap: Record<ServicoStatus, { label: string; color: string; description: string }> = {
    0: { label: 'Aberto', color: 'text-red-400 bg-red-500/20 border-red-500', description: 'O projeto foi iniciado e está sendo planejado.' },
    1: { label: 'Em Desenvolvimento', color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500', description: 'A codificação e o design estão em andamento.' },
    2: { label: 'Em Teste (QA)', color: 'text-blue-400 bg-blue-500/20 border-blue-500', description: 'O serviço está pronto e aguarda testes e feedback do cliente.' },
    3: { label: 'Concluído', color: 'text-green-400 bg-green-500/20 border-green-500', description: 'O projeto foi finalizado e entregue ao cliente.' },
};

// Opções para o select de status (apenas para Admin/Funcionário)
const statusOptions = [
    { value: 0, label: 'Aberto' },
    { value: 1, label: 'Em Desenvolvimento' },
    { value: 2, label: 'Em Teste (QA)' },
    { value: 3, label: 'Concluído' },
];

export default function ServicoDetalhePage() {
    const { profile, isEmployee } = useAuth();
    const params = useParams();
    const router = useRouter();
    const servicoId = params.servicoId as string;

    const [servico, setServico] = useState<ServicoDetalhe | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusSelecionado, setStatusSelecionado] = useState<ServicoStatus>(0);
    const [observacaoInterna, setObservacaoInterna] = useState('');
    
    // Estado para o campo de progresso do cliente
    const [progressoCliente, setProgressoCliente] = useState('');
    
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchServico = useCallback(async () => {
        if (!servicoId || !profile) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('servicos')
            .select(`
                id, nome_servico, status, observacoes, created_at, progresso_cliente,
                orcamento:orcamento_id (titulo),
                cliente:cliente_id (nome, email)
            `)
            .eq('id', servicoId)
            .single();

        if (error) {
            toast.error('Erro ao carregar serviço ou Acesso negado.');
            router.push('/servicos');
            return;
        }

        if (data) {
            // Agora o cast é seguro, pois a interface ServicoDetalhe corresponde exatamente à estrutura do 'data'
            setServico(data as any as ServicoDetalhe);
            setStatusSelecionado(data.status);
            setObservacaoInterna(data.observacoes || '');
            // Atualiza o estado de progresso com o valor do banco
            setProgressoCliente(data.progresso_cliente || '');
        }

        setLoading(false);
    }, [servicoId, profile, router]);

    useEffect(() => {
        fetchServico();
    }, [fetchServico]);

    // Ações do Admin/Funcionário (Alterar Status/Obs)
    const handleAdminUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!servico || !isEmployee) return;

        setIsUpdating(true);
        const { error } = await supabase
            .from('servicos')
            .update({ 
                status: statusSelecionado, 
                observacoes: observacaoInterna,
                progresso_cliente: progressoCliente // Inclui o campo editável
            } as any) // Usamos 'as any' para garantir que o Supabase SDK aceite a atualização, resolvendo o último erro.
            .eq('id', servico.id);

        if (error) {
            toast.error('Falha ao atualizar serviço.');
        } else {
            toast.success('Serviço atualizado!');
            fetchServico();
        }
        setIsUpdating(false);
    };


    if (loading) {
        return <PainelLayout><div className="flex justify-center p-10 text-blue-400"><Loader2 className="animate-spin mr-2" size={24} /> Carregando detalhes...</div></PainelLayout>;
    }

    if (!servico) {
        return <PainelLayout><div className="text-red-400 p-10">Serviço não encontrado ou acesso restrito.</div></PainelLayout>;
    }

    const statusDetalhes = statusMap[servico.status];

    return (
        <PainelLayout>
            <div className="max-w-6xl mx-auto">
                <Link href="/servicos" className="flex items-center text-gray-400 hover:text-white transition mb-6">
                   <ArrowLeft size={16} className="mr-2" /> Voltar para a Lista de Serviços
                </Link>
                
                <header className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center">
                        <Briefcase size={36} className='mr-3 text-blue-400' />
                        {servico.nome_servico}
                    </h1>
                    <div className="flex items-center space-x-4 text-gray-400 text-sm">
                        <p className="flex items-center"><Calendar size={14} className="mr-1" /> Iniciado em: {new Date(servico.created_at).toLocaleDateString('pt-BR')}</p>
                        {servico.cliente && (
                            <p className="flex items-center"><User size={14} className="mr-1" /> Cliente: {servico.cliente.nome || servico.cliente.email}</p>
                        )}
                        {servico.orcamento && (
                            <p className="flex items-center"><DollarSign size={14} className="mr-1" /> Orçamento: {servico.orcamento.titulo}</p>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Principal: Status e Detalhes */}
                    <div className="lg:col-span-2 space-y-8">
                        
                         {/* Status Atual */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 flex items-center justify-between">
                            <div className='flex items-center space-x-4'>
                                <CheckCircle size={40} className={statusDetalhes.color.split(' ')[0]} />
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Status Atual</h2>
                                    <span className={`text-sm font-semibold py-1 px-3 rounded-full border mt-1 ${statusDetalhes.color}`}>
                                        {statusDetalhes.label}
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-400 max-w-xs text-right hidden sm:block">{statusDetalhes.description}</p>
                        </div>

                        {/* Seção de Progresso para o Cliente (AGORA EDITÁVEL) */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                                <Code size={20} className='mr-2 text-yellow-400' /> Progresso e Entregas Recentes
                            </h2>
                            <p className="text-gray-400 whitespace-pre-wrap">
                                {servico.progresso_cliente || 'Nenhuma atualização de progresso registrada ainda.'}
                            </p>
                            
                            {/* A lista Mock foi removida e substituída pelo campo progresso_cliente */}
                        </div>


                        {/* Observações Internas (Apenas Admin/Funcionário vê no Gerenciamento Interno) */}
                        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                                <FileText size={20} className='mr-2 text-blue-400' /> Notas Internas do Serviço
                            </h2>
                            <p className="text-gray-400 whitespace-pre-wrap">{servico.observacoes || 'Nenhuma observação interna registrada.'}</p>
                        </div>
                    </div>

                    {/* Coluna Lateral: Ações do Admin/Funcionário */}
                    {isEmployee && (
                        <div className="lg:col-span-1 space-y-8">
                            <form onSubmit={handleAdminUpdate} className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                                <h2 className="text-xl font-bold text-white border-b border-gray-700 pb-2">Gerenciamento Interno</h2>
                                
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-300">Alterar Status</label>
                                    <select
                                        id="status"
                                        required
                                        value={statusSelecionado}
                                        onChange={(e) => setStatusSelecionado(parseInt(e.target.value) as ServicoStatus)}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {statusOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* CAMPO EDITÁVEL: Progresso do Cliente */}
                                <div>
                                    <label htmlFor="progressoCliente" className="block text-sm font-medium text-gray-300">Progresso Visível ao Cliente</label>
                                    <textarea id="progressoCliente" value={progressoCliente} onChange={(e) => setProgressoCliente(e.target.value)}
                                        rows={4}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Novas entregas, links para staging, etc."
                                    />
                                </div>


                                <div>
                                    <label htmlFor="obsInterna" className="block text-sm font-medium text-gray-300">Observação Interna (Admin/Notas da Equipe)</label>
                                    <textarea id="obsInterna" value={observacaoInterna} onChange={(e) => setObservacaoInterna(e.target.value)}
                                        rows={3}
                                        className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Notas de progresso para a equipe."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-bold transition ${
                                        isUpdating
                                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    {isUpdating ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Atualizar Serviço'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </PainelLayout>
    );
}
