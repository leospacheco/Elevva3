// src/hooks/useAuth.tsx
'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useContext, createContext, ReactNode, useRef } from 'react';
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
    // ... (Verificação Crítica de Ambiente)
    // -----------------------------------------------------------

    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // REF para garantir que o isLoading seja definido como false apenas uma vez na montagem
    const initialLoadRef = useRef(true); // <-- NOVO REF

    const fetchUserProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Erro ao buscar perfil:', error);
            // Lança um erro para que seja capturado no onAuthStateChange ou loadInitialSession
            throw new Error(error.message);
        }
        setProfile(data as Profile);
    };

    const refreshProfile = async () => {
        if (user) {
            // Envolve em try/catch para evitar crash em caso de falha de rede/RLS
            try {
                await fetchUserProfile(user.id);
            } catch (e) {
                console.error("Falha ao atualizar perfil.", e);
                toast.error("Falha ao atualizar dados do perfil.");
            }
        }
    };

    useEffect(() => {
        let isMounted = true;

        // 1. ROTINA DE CARGA INICIAL (F5, Troca de Aba, etc.):
        const loadInitialSession = async () => {
            // Garante que só roda se o componente estiver montado e for a primeira vez
            if (!isMounted || !initialLoadRef.current) return;

            try {
                // Tenta obter a sessão (Supabase lê do cache/cookies)
                const { data: { session } } = await supabase.auth.getSession();

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                // Se há usuário, busca o perfil.
                if (currentUser) {
                    await fetchUserProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
            } catch (error) {
                // Captura erros (ex: rede, falha de RLS)
                console.error("Erro durante a carga inicial da sessão/perfil:", error);
                if (isMounted) {
                    toast.error("Erro crítico ao carregar dados de autenticação.");
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                // CORREÇÃO PRINCIPAL: DESLIGA O LOADING GARANTIDO
                if (isMounted && initialLoadRef.current) {
                    setIsLoading(false);
                    initialLoadRef.current = false; // Garante que nunca mais será ativado
                }
            }
        };

        // 2. MONITORAMENTO DE MUDANÇA (Eventos em tempo real):
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Se o loading inicial ainda não terminou, ignoramos este evento.
                if (!isMounted || initialLoadRef.current) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                try {
                    if (currentUser) {
                        await fetchUserProfile(currentUser.id);
                    } else {
                        setProfile(null);
                        // Redireciona se o evento for de desautenticação
                        if (event === 'SIGNED_OUT' && router) {
                            router.push('/login');
                        }
                    }
                } catch (error) {
                    console.error("Erro no onAuthStateChange ao buscar perfil:", error);
                }
            }
        );

        // Inicia a carga inicial (que irá desativar o isLoading)
        loadInitialSession();

        // Cleanup:
        return () => {
            isMounted = false;
            authListener.subscription.unsubscribe();
        };
    }, []); // Roda apenas na montagem

    const signOut = async () => {
        // ... (Restante do signOut)
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
