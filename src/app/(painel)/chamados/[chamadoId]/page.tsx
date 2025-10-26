// src/app/(painel)/chamados/[chamadoId]/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
// CORREÇÃO: Usar Omit para evitar conflito na extensão
import { Chamado, Mensagem, ChamadoStatus } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, Send, Clock, User, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// Interface auxiliar para o fetch do Chamado com o perfil do cliente
// CORREÇÃO: Omitimos profiles do Chamado base e o redefinimos aqui.
interface ChamadoComProfile extends Omit<Chamado, 'profiles'> {
    profiles: {
        nome: string | null;
        email: string;
    } | null;
}

// Interface auxiliar para o fetch da Mensagem com o perfil do remetente
// CORREÇÃO: Omitimos remetente do Mensagem base e o redefinimos aqui.
interface MensagemComProfile extends Omit<Mensagem, 'remetente'> {
    remetente: {
        nome: string | null;
        email: string;
    } | null;
}

const statusMap: Record<ChamadoStatus, { label: string; color: string }> = {
    0: { label: 'Aberto', color: 'bg-red-500/20 text-red-400' },
    1: { label: 'Em Andamento', color: 'bg-yellow-500/20 text-yellow-400' },
    2: { label: 'Fechado', color: 'bg-green-500/20 text-green-400' },
};

export default function ChatChamadoPage() {
    const { user, profile, isEmployee } = useAuth();
    const params = useParams();
    const router = useRouter();
    const chamadoId = params.chamadoId as string;

    const [chamado, setChamado] = useState<ChamadoComProfile | null>(null);
    const [mensagens, setMensagens] = useState<MensagemComProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [novaMensagem, setNovaMensagem] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Função para rolar para a última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchChamadoData = useCallback(async () => {
        if (!user || !chamadoId) return;

        const { data: chamadoData } = await supabase
            .from('chamados')
            .select(`
                *,
                profiles:cliente_id (nome, email)
            `)
            .eq('id', chamadoId)
            .single();

        if (!chamadoData) {
            toast.error("Chamado não encontrado ou você não tem permissão.");
            router.push('/chamados');
            return;
        }

        // Se não for funcionário, garante que é o cliente proprietário
        if (!isEmployee && chamadoData.cliente_id !== user.id) {
            toast.error("Você não tem permissão para visualizar este chamado.");
            router.push('/chamados');
            return;
        }

        // Usamos 'as any as ChamadoComProfile' para forçar o cast com o join
        setChamado(chamadoData as any as ChamadoComProfile);

        // Busca mensagens
        const { data: mensagensData } = await supabase
            .from('mensagens')
            .select(`
                *,
                remetente:remetente_id (nome, email)
            `)
            .eq('chamado_id', chamadoId)
            .order('created_at', { ascending: true });

        // Usamos 'as any as MensagemComProfile[]' para forçar o cast com o join
        setMensagens((mensagensData as any as MensagemComProfile[]) || []);
        setLoading(false);
    }, [user, chamadoId, router, isEmployee]);

    // Envio da Mensagem
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !user) return;

        const contentToSend = novaMensagem.trim();
        setNovaMensagem(''); // Limpa imediatamente

        const { error } = await supabase.from('mensagens').insert({
            chamado_id: chamadoId,
            remetente_id: user.id,
            conteudo: contentToSend,
        });

        if (error) {
            toast.error('Erro ao enviar mensagem.');
            setNovaMensagem(contentToSend); // Reverte o estado se houver erro
        }
    };

    // Atualização de Status (Apenas para Funcionário)
    const handleStatusChange = async (newStatus: ChamadoStatus) => {
        if (!isEmployee || !chamado) return;

        const { error } = await supabase
            .from('chamados')
            .update({ status: newStatus })
            .eq('id', chamadoId);

        if (error) {
            toast.error('Erro ao atualizar status.');
        } else {
            toast.success(`Status alterado para ${statusMap[newStatus].label}.`);
            // Atualiza o estado localmente sem recarregar
            setChamado({ ...chamado, status: newStatus });
        }
    };


    useEffect(() => {
        fetchChamadoData();

        // Configuração do Realtime
        const channel = supabase
            .channel(`chamado_${chamadoId}_chat`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `chamado_id=eq.${chamadoId}` },
                (payload) => {
                    // A nova mensagem vem no payload.new
                    const novaMsg: Mensagem = payload.new as Mensagem;

                    // Supabase Realtime não traz o JOIN, então buscamos o nome do remetente
                    supabase.from('profiles').select('nome, email').eq('id', novaMsg.remetente_id).single()
                        .then(({ data: remetenteProfile }) => {
                            const mensagemComProfile: MensagemComProfile = {
                                ...novaMsg,
                                // Mapeia o resultado do select para a prop remetente
                                remetente: remetenteProfile,
                            } as any as MensagemComProfile; // Cast forçado

                            setMensagens((prev) => [...prev, mensagemComProfile]);

                            // Adiciona um pequeno delay para garantir que a rolagem ocorra após a renderização
                            setTimeout(scrollToBottom, 100);
                        });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [chamadoId, fetchChamadoData]);

    useEffect(() => {
        // Rola para o final na primeira carga (após o fetch)
        if (!loading) {
            scrollToBottom();
        }
    }, [loading]);

    if (loading) {
        return (
            <PainelLayout>
                <div className="flex justify-center items-center h-96 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={32} /> Carregando Chamado...
                </div>
            </PainelLayout>
        );
    }

    const isClosed = chamado?.status === 2;

    return (
        <PainelLayout>
            <div className="flex justify-between items-start mb-6 border-b border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-white mb-1">{chamado?.titulo}</h1>
                    <p className="text-gray-400">
                        {isEmployee ? `Cliente: ${chamado?.profiles?.nome || chamado?.profiles?.email}` : `ID: ${chamadoId.slice(0, 8)}...`}
                    </p>
                </div>

                <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${statusMap[chamado?.status || 0].color}`}>
                        Status: {statusMap[chamado?.status || 0].label}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                        Prioridade: <span className="capitalize">{chamado?.prioridade}</span>
                    </p>
                </div>
            </div>

            {/* Opções do Funcionário: Mudar Status */}
            {isEmployee && (
                <div className="mb-6 flex space-x-3">
                    <span className='text-gray-400 font-semibold self-center'>Alterar Status:</span>
                    {[0, 1, 2].map(s => {
                        const statusKey = s as ChamadoStatus;
                        const details = statusMap[statusKey];
                        const isActive = chamado?.status === statusKey;

                        return (
                            <button
                                key={s}
                                onClick={() => handleStatusChange(statusKey)}
                                disabled={isActive}
                                className={`px-4 py-2 text-sm rounded-full font-medium transition ${isActive
                                        ? `${details.color} text-white border-2 border-opacity-70`
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {details.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="bg-gray-800 p-4 rounded-xl shadow-inner flex flex-col h-[70vh]">
                {/* Área de Mensagens */}
                <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4">
                    {mensagens.map((msg) => {
                        const isMine = msg.remetente_id === user?.id;
                        const senderName = isMine ? 'Você' : (msg.remetente?.nome || msg.remetente?.email || 'Usuário');

                        return (
                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${isMine
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-700 text-white rounded-tl-none'
                                    }`}>
                                    <p className="text-xs font-semibold mb-1 opacity-80">
                                        {senderName}
                                    </p>
                                    <p className="text-base break-words">{msg.conteudo}</p>
                                    <p className="text-[10px] mt-1 text-right opacity-60">
                                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} /> {/* Ponto de rolagem */}
                </div>

                {/* Formulário de Envio */}
                {isClosed ? (
                    <div className="p-4 text-center text-gray-400 bg-gray-700 rounded-lg">
                        <X size={16} className='inline mr-2' /> Este chamado está fechado. Não é possível enviar novas mensagens.
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex space-x-3 mt-auto">
                        <input
                            type="text"
                            value={novaMensagem}
                            onChange={(e) => setNovaMensagem(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500"
                            disabled={!user}
                        />
                        <button
                            type="submit"
                            disabled={!user || novaMensagem.trim() === ''}
                            className={`p-3 rounded-lg transition ${!user || novaMensagem.trim() === ''
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            <Send size={24} />
                        </button>
                    </form>
                )}
            </div>
        </PainelLayout>
    );
}
