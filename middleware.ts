// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Rotas públicas (não exigem login)
const PUBLIC_ROUTES = ['/', '/login', '/register', '/termos'];

// Rotas protegidas (exigem login)
const PROTECTED_ROUTES = ['/dashboard', '/chamados', '/orcamentos', '/servicos'];

// Rotas exclusivas para Funcionários (role >= 1)
const EMPLOYEE_ROUTES = ['/admin', '/clientes', '/servicos/novo', '/orcamentos/novo', '/chamados/responder'];

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    
    // Obter sessão do Supabase (atualiza cookies se necessário)
    const { data: { session } } = await supabase.auth.getSession();
    
    const pathname = req.nextUrl.pathname;
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    // --- Lógica de Autenticação ---
    
    // 1. Se o usuário estiver tentando acessar uma rota protegida (mas não pública)
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/painel') {
        if (!session) {
            // Se não estiver logado, redireciona para o login
            return NextResponse.redirect(new URL('/login', req.url));
        }
        
        // --- Lógica de Permissão (Role) ---
        
        // 2. Se logado, checar a Role para rotas de Funcionário
        if (EMPLOYEE_ROUTES.some(route => pathname.startsWith(route))) {
            const { data: profileData } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
            const userRole = profileData?.role ?? 0; // Padrão Cliente
            
            // Se a role for menor que 1 (Cliente), bloqueia
            if (userRole < 1) {
                 return NextResponse.redirect(new URL('/dashboard', req.url)); // Redireciona para o painel do cliente
            }
        }
        
    } else if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        // 3. Se logado, não pode acessar as páginas de Login/Registro
        if (session) {
            return NextResponse.redirect(new URL('/dashboard', req.url));
        }
    }

    return res;
}

// Rotas que o middleware deve interceptar
export const config = {
    matcher: [
        /*
         * Corresponde a todos os caminhos exceto aqueles que contêm:
         * - _next/static (arquivos estáticos)
         * - _next/image (arquivos de imagem otimizados)
         * - favicon.ico (favicon)
         * - /images/* (seus ativos públicos)
         * E todas as rotas de nível superior (exceto a API do Supabase Auth)
         */
        '/((?!api/auth|_next/static|_next/image|favicon.ico|images|termos|manifest.json).*)',
    ],
};
