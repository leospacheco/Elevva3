// src/app/api/admin/invite-employee/route.ts
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rota protegida de API para convidar um novo Funcionário ou Administrador.
 * Requer a SUPABASE_SERVICE_KEY e que o usuário solicitante seja um Admin (role 2).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, nome, role } = body; // role deve ser 1 (Funcionário) ou 2 (Admin)

        if (!email || !password || !nome || !role) {
            return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 });
        }

        // --- 1. Verificar Permissão do Usuário Logado ---
        const token = req.headers.get('Authorization')?.split(' ')[1];
        if (!token) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        // Usar o token do Supabase para verificar o perfil
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) {
            return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
        }

        // Buscar a role do usuário solicitante (DEVE ser Admin = 2)
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile?.role !== 2) {
            return NextResponse.json({ error: 'Acesso negado. Apenas Administradores podem convidar.' }, { status: 403 });
        }

        // --- 2. Criar o Usuário com a Role via SERVICE_KEY ---

        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.signUp({
            email,
            password,
            options: {
                // Metadados que serão capturados pelo Trigger SQL (handle_new_user)
                data: { nome: nome },
            }
        });

        if (signUpError) {
            return NextResponse.json({ error: signUpError.message }, { status: 400 });
        }

        // --- 3. Atualizar a Role no banco de dados (profiles) ---
        // Se o trigger falhar, garantimos a role aqui.

        if (newUser.user) {
            const { error: roleUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({ role: role }) // 1 para Funcionário, 2 para Admin
                .eq('id', newUser.user.id);

            if (roleUpdateError) {
                // É crítico logar este erro, pois o usuário foi criado, mas a role não foi definida
                console.error('ERRO CRÍTICO: Falha ao atualizar ROLE do novo usuário:', roleUpdateError);
            }
        }

        return NextResponse.json({ message: `Funcionário ${nome} convidado com sucesso!` });

    } catch (e) {
        console.error('Erro na API de Convite:', e);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
