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
        let isMounted = true; // Flag para evitar atualização de estado após desmontagem

        // 1. O onAuthStateChange é a ÚNICA fonte de verdade. Ele dispara imediatamente.
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                try {
                    if (currentUser) {
                        // Se houver usuário, tenta buscar o perfil
                        await fetchUserProfile(currentUser.id);
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("Erro no onAuthStateChange ao buscar perfil:", error);
                    // Deixa a lógica do finally desligar o loading
                }

                // CORREÇÃO DE LOADING: Se for o primeiro disparo (carga inicial), desliga o loading
                if (initialLoadRef.current) {
                    setIsLoading(false);
                    initialLoadRef.current = false;
                }
            }
        );

        // CORREÇÃO DE SAFETY: Adiciona um timeout de segurança para desligar o loader 
        // caso o evento inicial do Supabase demore demais ou falhe (o que acontece em F5/aba inativa).
        const timeoutId = setTimeout(() => {
            if (initialLoadRef.current && isMounted) {
                console.warn("Timeout de carregamento. Desligando loading state de segurança.");
                setIsLoading(false);
                initialLoadRef.current = false;
            }
        }, 5000); // 5 segundos é um tempo seguro.

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
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
