// src/types/app.d.ts

// Tipos para as Roles no Banco de Dados
export type UserRole = 0 | 1 | 2; // 0: Cliente, 1: Funcionário, 2: Administrador

// Interface do Perfil (profiles)
export interface Profile {
    id: string;
    nome: string | null;
    telefone: string | null;
    email: string;
    role: UserRole;
}

// Status dos Chamados
export type ChamadoStatus = 0 | 1 | 2; // 0: aberto, 1: em_andamento, 2: fechado

// Interface do Chamado (chamados)
export interface Chamado {
    id: string;
    cliente_id: string;
    titulo: string;
    descricao: string | null;
    status: ChamadoStatus;
    prioridade: 'baixa' | 'media' | 'alta';
    created_at: string;
    profiles?: { nome: string; email: string }; // Usado em JOIN (opcional)
}

// Interface da Mensagem (mensagens)
export interface Mensagem {
    id: string;
    chamado_id: string;
    remetente_id: string;
    conteudo: string;
    created_at: string;
    profiles?: { nome: string }; // Usado em JOIN (opcional)
}

// Interface do Orçamento (orcamentos)
export type OrcamentoStatus = 0 | 1 | 2 | 3; // 0: pendente, 1: aprovado, 2: rejeitado, 3: cancelado

export interface Orcamento {
    id: string;
    cliente_id: string;
    titulo: string;
    detalhes: any; // Lista de itens em JSONB
    status: OrcamentoStatus;
    valor_total: number;
    criado_por: string | null;
    observacoes: string | null;
    created_at: string;
    cliente?: { nome: string; email: string };
    criador?: { nome: string };
}

// Interface do Serviço (servicos)
export type ServicoStatus = 0 | 1 | 2 | 3; // 0: aberto, 1: em_desenvolvimento, 2: em_teste, 3: concluido

export interface Servico {
    id: string;
    orcamento_id: string | null;
    cliente_id: string;
    nome_servico: string;
    status: ServicoStatus;
    observacoes: string | null;
    created_at: string;
    cliente?: { nome: string; email: string };
}
