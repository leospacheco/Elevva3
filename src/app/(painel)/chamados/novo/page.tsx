// src/app/(painel)/chamados/novo/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { ListHeader } from '@/components/common/ListHeader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function NovoChamadoPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [prioridade, setPrioridade] = useState('media');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) {
            toast.error('Sessão expirada. Faça login novamente.');
            return;
        }

        setLoading(true);

        const { error } = await supabase.from('chamados').insert({
            cliente_id: profile.id,
            titulo: titulo,
            descricao: descricao,
            prioridade: prioridade,
            status: 0, // 0: aberto
        });

        if (error) {
            toast.error(`Erro ao abrir chamado: ${error.message}`);
        } else {
            toast.success('Chamado aberto com sucesso! Acompanhe o status.');
            router.push('/chamados');
        }
        setLoading(false);
    };

    return (
        <PainelLayout>
            <div className="max-w-4xl mx-auto">
                <ListHeader 
                    title="Abrir Novo Chamado" 
                    description="Descreva sua dúvida, problema ou solicitação. Nossa equipe responderá rapidamente."
                />

                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Título */}
                        <div>
                            <label htmlFor="titulo" className="block text-sm font-medium text-gray-300 mb-1">
                                Título do Chamado
                            </label>
                            <input
                                type="text"
                                id="titulo"
                                required
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ex: Dúvida sobre o Plano de Manutenção"
                                maxLength={100}
                            />
                        </div>

                        {/* Descrição */}
                        <div>
                            <label htmlFor="descricao" className="block text-sm font-medium text-gray-300 mb-1">
                                Descrição Detalhada
                            </label>
                            <textarea
                                id="descricao"
                                required
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                rows={5}
                                className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                placeholder="Descreva o problema ou solicitação com o máximo de detalhes possível."
                            />
                        </div>

                        {/* Prioridade */}
                        <div>
                            <label htmlFor="prioridade" className="block text-sm font-medium text-gray-300 mb-1">
                                Prioridade
                            </label>
                            <select
                                id="prioridade"
                                value={prioridade}
                                onChange={(e) => setPrioridade(e.target.value)}
                                className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="baixa">Baixa (Dúvida Geral)</option>
                                <option value="media">Média (Solicitação de Orçamento)</option>
                                <option value="alta">Alta (Problema Crítico/Urgente)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center items-center py-3 px-4 rounded-md text-lg font-bold transition ${
                                loading 
                                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Enviar Chamado'}
                        </button>
                    </form>
                </div>
            </div>
        </PainelLayout>
    );
}