// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// --- VERIFICAÇÃO RIGOROSA ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// --- NOVO SINGLETON PARA CLIENT-SIDE ---
// Cria uma instância global para garantir que o createClient seja chamado APENAS UMA VEZ
const getClientSingleton = () => {
    // Verifica se o cliente já existe no ambiente global (para persistir a instância)
    if (!(globalThis as any).supabase) {
        // Se não existe, cria a instância e a armazena no globalThis
        (globalThis as any).supabase = createClient(supabaseUrl, supabaseKey);
    }
    return (globalThis as any).supabase;
};

// Exporta o cliente único para ser usado nos componentes client-side
export const supabase = getClientSingleton();


// Cria uma instância para uso em ambientes de servidor (API Routes ou Server Components)
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { persistSession: false } }
);