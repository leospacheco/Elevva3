// src/app/register/page.tsx
'use client';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data: { user }, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Adiciona o nome aos metadados para ser pego pelo trigger SQL (Fase 1)
                data: { nome: nome }, 
            }
        });

        if (error) {
            toast.error(error.message);
        } else if (user) {
            toast.success('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
            // Após o registro, o usuário precisa confirmar o e-mail (Supabase padrão)
            router.push('/login?message=check_email'); 
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
                <Link href="/" className="flex items-center text-blue-400 hover:text-blue-300 transition mb-6">
                    <ArrowLeft size={16} className="mr-2" /> Voltar para a Home
                </Link>
                <h2 className="text-3xl font-extrabold text-white mb-6 text-center">
                    Crie sua Conta (Cliente)
                </h2>

                <form onSubmit={handleRegister} className="space-y-6">
                    <div>
                        <label htmlFor="nome" className="block text-sm font-medium text-gray-300">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            id="nome"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Seu nome ou nome da empresa"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="seu.email@exemplo.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                            Senha (mínimo 6 caracteres)
                        </label>
                        <input
                            type="password"
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-lg font-bold transition ${
                            loading 
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Cadastrar'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Já tem conta?{' '}
                    <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                        Fazer Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
