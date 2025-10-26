// src/app/(painel)/admin/invite-employee/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, UserPlus, Shield, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// CORREÇÃO: Importar o cliente Supabase
import { supabase } from '@/lib/supabase';

export default function InviteEmployeePage() {
    const { profile, isAdmin, user } = useAuth();
    const router = useRouter();

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'1' | '2'>('1'); // 1: Funcionário, 2: Admin
    const [loading, setLoading] = useState(false);

    // Se não for Admin (role 2), barra o acesso
    if (!isAdmin) {
        return (
            <PainelLayout>
                <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                    <h1 className="text-3xl font-extrabold mb-4">Acesso Restrito</h1>
                    <p>Apenas Administradores podem convidar novos membros para a equipe.</p>
                </div>
            </PainelLayout>
        );
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // CORREÇÃO DE OBTENÇÃO DO TOKEN: Obtém a sessão para garantir o token de acesso.
        // O cliente `supabase` agora está disponível após a importação.
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
            toast.error("Erro de autenticação: Sessão inválida ou expirada. Tente fazer login novamente.");
            setLoading(false);
            return;
        }

        try {
            // O token de acesso da sessão será usado para provar que este usuário está logado
            const accessToken = session.access_token;

            const response = await fetch('/api/admin/invite-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}` // Token de autorização para a API Route
                },
                body: JSON.stringify({ nome, email, password, role: parseInt(role) }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao processar convite.');
            }

            toast.success(data.message);
            // Limpa o formulário
            setNome('');
            setEmail('');
            setPassword('');
            setRole('1');

            // Recarrega a lista de clientes para incluir o novo funcionário (se estiver no painel)
            router.refresh();

        } catch (error: any) {
            console.error('Erro no convite:', error);
            // Trata erros de e-mail já registrado, senha fraca, etc.
            toast.error(error.message || 'Falha ao convidar funcionário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PainelLayout>
            <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                <Link href="/clientes" className="flex items-center text-gray-400 hover:text-white transition mb-6">
                    <X size={16} className="mr-2" /> Voltar para a Gestão de Clientes
                </Link>
                <h2 className="text-3xl font-extrabold text-white mb-6 text-center">
                    <UserPlus size={32} className='inline mr-3 text-blue-400' /> Convidar Membro da Equipe
                </h2>

                <form onSubmit={handleInvite} className="space-y-6">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300">Nome Completo</label>
                        <input type="text" id="nome" required value={nome} onChange={(e) => setNome(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nome do novo membro"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                        <input type="email" id="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="email@elevvaweb.com.br"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Senha Provisória</label>
                        <input type="password" id="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-300">Nível de Acesso</label>
                        <select id="role" required value={role} onChange={(e) => setRole(e.target.value as '1' | '2')}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="1">Funcionário (Acesso a Chamados/Orçamentos)</option>
                            <option value="2">Administrador (Acesso Total)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !isAdmin}
                        className={`w-full flex justify-center items-center py-3 px-4 rounded-md text-lg font-bold transition ${loading || !isAdmin
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={24} /> : <><Shield size={24} className='mr-2' /> Convidar Membro</>}
                    </button>
                </form>
            </div>
        </PainelLayout>
    );
}
