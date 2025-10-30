// src/app/login/page.tsx
'use client';

import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    useEffect(() => {
        if (searchParams.get('message') === 'check_email') {
            toast.success('Cadastro realizado! Por favor, **confirme seu email** para ativar sua conta e fazer login. (Verifique sua caixa de spam).', {
                duration: 8000, // Exibe por mais tempo
            });
            // Opcional: Remover o parâmetro da URL após exibir a mensagem
            router.replace('/login', undefined);
        }
    }, [searchParams, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            toast.error(error.message);
        } else {
            // O middleware se encarrega de redirecionar para o /dashboard após o login
            toast.success('Login bem-sucedido! Redirecionando...');
            router.push('/dashboard');
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
                    Acessar Painel Elevva Web
                </h2>

                <form onSubmit={handleLogin} className="space-y-6">
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
                            Senha
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
                        className={`w-full flex justify-center items-center py-2 px-4 rounded-md text-lg font-bold transition ${loading
                                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={24} /> : 'Entrar'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-400">
                    Novo na Elevva Web?{' '}
                    <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300">
                        Crie sua conta
                    </Link>
                </p>
            </div>
        </div>
    );
}
