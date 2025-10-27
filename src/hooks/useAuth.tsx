// src/hooks/useAuth.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useContext, createContext, ReactNode } from 'react';
import { Profile } from '@/types/app';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast'; // Adicionado para feedback visual

// Define o que o contexto de autenticação irá prover
interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    isLoading: boolean;
    isAdmin: boolean;
    isEmployee: boolean;
    isClient: boolean;
    signOut: () => void;
    refreshProfile: () => Promise<void>;
}

// Cria o contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // -----------------------------------------------------------
    // VERIFICAÇÃO CRÍTICA DE AMBIENTE:
    // Garante que o .env.local foi carregado corretamente com chaves públicas.
    const hasSupabaseKeys = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se as chaves estiverem ausentes, paramos a execução para evitar o erro SupabaseKey is required.
    if (!hasSupabaseKeys) {
        if (typeof window !== 'undefined') { // Apenas no lado do cliente
            // Exibe o erro no toast para o usuário
            toast.error("Erro: Chaves do Supabase estão faltando. Verifique o .env.local.");
            console.error("ERRO CRÍTICO: Chaves NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY estão ausentes ou vazias.");
        }
        // Retorna um componente de erro na tela para evitar o Hydration Mismatch
        return <div className="min-h-screen flex justify-center items-center bg-gray-900 text-red-500">ERRO: Chaves do Supabase Ausentes. Verifique o .env.local.</div>;
    }
    // -----------------------------------------------------------


    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();


    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil:', error);
            // CORREÇÃO: Lançar um erro se o perfil não for encontrado/buscado
            // Isso garante que o .catch() no useEffect seja acionado.
            throw new Error(error.message);
        }
        setProfile(data as Profile);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchUserProfile(user.id);
        }
    };

    useEffect(() => {
        let isMounted = true; // Flag para garantir que o estado só é atualizado se o componente estiver montado.

        // 1. Configura o monitoramento de mudanças de estado (para eventos em tempo real, como logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                // Se houver usuário, busca o perfil.
                if (currentUser) {
                    await fetchUserProfile(currentUser.id);
                } else {
                    // Se for um evento de LOGOUT ou sessão nula, limpa e desliga o loading.
                    setProfile(null);
                }
                // Definir o loading para false em qualquer evento AUTH_STATE_CHANGE é crucial,
                // mas a rotina loadInitialSession lida com a primeira vez.
            }
        );

        // 2. Rotina de Carga Inicial Atômica (Executada apenas no mount)
        const loadInitialSession = async () => {
            try {
                // Tenta obter a sessão no cache
                const { data: { session } } = await supabase.auth.getSession();

                if (!isMounted) return; // Checa antes de prosseguir

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                // Se houver usuário, busca o perfil.
                if (currentUser) {
                    // Espera a busca do perfil para definir o estado.
                    await fetchUserProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
            } catch (error) {
                // Captura qualquer erro de rede, timeout, ou erro no fetchUserProfile
                console.error("Erro durante a carga inicial da sessão/perfil:", error);
                if (isMounted) {
                    toast.error("Erro crítico ao carregar dados. Tente recarregar.");
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                // CORREÇÃO PRINCIPAL: Garante que o estado de loading seja desligado, 
                // independentemente do resultado.
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Inicia a rotina
        loadInitialSession();

        // Cleanup: Garante que o listener seja removido e o flag desativado na desmontagem
        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []); // Roda apenas na montagem

    const signOut = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        router.push('/login');
    };

    const contextValue: AuthContextType = {
        user,
        profile,
        isLoading,
        isAdmin: profile?.role === 2,
        isEmployee: (profile?.role ?? 0) >= 1, // Funcionário ou Admin
        isClient: profile?.role === 0,
        signOut,
        refreshProfile
    };

    return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

// Hook customizado para usar o contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};

// Wrapper para usar no layout principal
export const AuthWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
);
