// src/app/(painel)/clientes/page.tsx
'use client';

import { PainelLayout } from '@/components/layout/PainelLayout';
import { useAuth } from '@/hooks/useAuth';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/app';
import toast from 'react-hot-toast';
import { Loader2, User, Mail, Phone, Search, Users } from 'lucide-react';
import { ListHeader } from '@/components/common/ListHeader';
import Link from 'next/link';

export default function ClientesPage() {
    const { profile, isEmployee } = useAuth();
    const [clientes, setClientes] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchClientes = useCallback(async () => {
        if (!isEmployee) return; // Apenas Funcionário/Admin pode ver
        setLoading(true);

        let query = supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        // Filtra apenas clientes (role 0) e funcionários (role 1) ou admin (role 2)
        // Incluímos funcionários/admin para facilitar a visualização da equipe (opcional)
        // query = query.gte('role', 0); 
        query = query.or('role.eq.0,role.eq.1,role.eq.2'); // Traz todos, mas com o OR é mais explícito.

        const { data, error } = await query;

        if (error) {
            toast.error('Erro ao carregar clientes.');
            console.error('Erro ao buscar clientes:', error);
            setClientes([]);
        } else {
            // Filtro manual por termo de busca no lado do cliente
            const filteredData = data.filter(p =>
                p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setClientes(filteredData as Profile[]);
        }

        setLoading(false);
    }, [isEmployee, searchTerm]);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    if (!isEmployee) {
        return (
            <PainelLayout>
                <div className="bg-red-900/40 p-6 rounded-xl border-l-4 border-red-500 text-white">
                    <h1 className="text-3xl font-extrabold mb-4">Acesso Negado</h1>
                    <p>Você não tem permissão para acessar esta área.</p>
                </div>
            </PainelLayout>
        );
    }


    const headerDescription = 'Gerencie todos os usuários cadastrados (Clientes, Funcionários e Administradores).';

    return (
        <PainelLayout>
            <ListHeader
                title="Gestão de Usuários e Clientes"
                description={headerDescription}
                buttonText={profile?.role === 2 ? 'Convidar Funcionário' : undefined}
                buttonHref={profile?.role === 2 ? '/admin/invite-employee' : undefined}
            />

            <div className="mb-6 flex space-x-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                    disabled={!searchTerm}
                >
                    Limpar Busca
                </button>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-40 text-blue-400">
                    <Loader2 className="animate-spin mr-2" size={24} /> Carregando Clientes...
                </div>
            )}

            {!loading && clientes.length === 0 && (
                <div className="text-center p-10 bg-gray-800 rounded-xl border border-gray-700">
                    <p className="text-gray-400">Nenhum usuário encontrado com o termo de busca.</p>
                </div>
            )}

            {!loading && clientes.length > 0 && (
                <div className="space-y-4">
                    {clientes.map((cliente) => {
                        const roleName = cliente.role === 2 ? 'Administrador' : cliente.role === 1 ? 'Funcionário' : 'Cliente';
                        const roleColor = cliente.role >= 1 ? 'bg-blue-600' : 'bg-gray-600';

                        return (
                            <div key={cliente.id} className="bg-gray-800 p-5 rounded-xl border border-gray-700 shadow-lg flex justify-between items-start">
                                {/* Info Principal */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-xl font-bold text-white truncate mb-1">{cliente.nome || 'Nome não definido'}</p>

                                    <p className="text-sm text-gray-400 flex items-center mt-1">
                                        <Mail size={16} className="mr-2 text-gray-500" /> {cliente.email}
                                    </p>
                                    {cliente.telefone && (
                                        <p className="text-sm text-gray-400 flex items-center mt-1">
                                            <Phone size={16} className="mr-2 text-gray-500" /> {cliente.telefone}
                                        </p>
                                    )}
                                </div>

                                {/* Status e Role */}
                                <div className="flex flex-col items-end mx-4 flex-shrink-0">
                                    <span className={`text-xs font-semibold py-1 px-3 rounded-full text-white ${roleColor} mb-2`}>
                                        {roleName}
                                    </span>
                                    <p className="text-xs text-gray-500">
                                        ID: {cliente.id.slice(0, 8)}...
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </PainelLayout>
    );
}
