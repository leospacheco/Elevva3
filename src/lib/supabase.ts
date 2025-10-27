// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// --- VERIFICAÇÃO RIGOROSA ---
// Força a leitura das variáveis de ambiente ou define como string vazia se ausente, 
// o que permite o TypeScript e o runtime lidar com a falha de forma segura.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Se as chaves estiverem vazias, o código abaixo irá falhar, 
// o que é esperado e será tratado pelo useAuth.tsx para evitar quebras.
// Se as chaves NÃO forem encontradas no servidor (Next.js Server Component), a inicialização falhará aqui.

// Cria uma instância do cliente Supabase para ser usada no lado do cliente (navegador)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cria uma instância para uso em ambientes de servidor (API Routes ou Server Components)
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabaseAdmin = createClient(
    supabaseUrl,
    serviceRoleKey,
    { auth: { persistSession: false } }
);
