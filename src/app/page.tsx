// src/app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Zap, Shield, Layout, Settings, Rocket, DollarSign, Clock, Package, TrendingUp } from 'lucide-react';
import { WhatsAppButton } from '@/components/WhatsAppButton';

// Caminhos CORRIGIDOS para os arquivos do usuário
const LOGO_PATH = '/images/logo-elevva.png';
const PLANS_PATH = '/images/planos-elevva.jpg';

// Card de Funcionalidade
const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition duration-300 shadow-xl text-left">
        <Icon size={32} className="text-blue-400 mb-3" />
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-gray-400">{description}</p>
    </div>
);

// --- NOVA INTERFACE PARA TIPAGEM DO PRICING CARD ---
interface ServiceItem {
    name: string;
    price: string;
}

interface PricingCardProps {
    title: string;
    services: ServiceItem[];
    features: string[];
    isMain: boolean;
    paymentNote?: string;
    type: string; // Ex: 'Pagamento Único' ou 'Mensal Opcional'
}

// Novo componente para a Seção de Planos (AGORA TIPADO CORRETAMENTE)
const PricingCard: React.FC<PricingCardProps> = ({ title, services, features, isMain, paymentNote, type }) => (
    <div className={`p-8 rounded-2xl shadow-2xl transition duration-500 flex flex-col h-full ${isMain ? 'bg-green-600/10 border-4 border-green-500/50' : 'bg-gray-800 border border-gray-700'
        }`}>
        <div className="flex-grow">
            <h4 className={`text-2xl font-bold mb-1 ${isMain ? 'text-green-400' : 'text-white'}`}>{title}</h4>
            <p className="text-sm text-gray-400 mb-6">{type}</p>

            <div className='mb-6'>
                {services.map((s) => (
                    <div key={s.name} className="flex justify-between items-end border-b border-gray-700 py-2">
                        <p className="font-semibold text-white">{s.name}</p>
                        {/* Removido o ternário redundante, agora tipado */}
                        <p className={`text-xl font-extrabold ${isMain ? 'text-green-400' : 'text-blue-400'}`}>{s.price}</p>
                    </div>
                ))}
            </div>

            {paymentNote && <p className="text-sm text-gray-400 italic mb-6 border-b border-gray-700 pb-3">{paymentNote}</p>}

            <h5 className="text-lg font-semibold text-white mb-3">O que inclui:</h5>
            <ul className="space-y-2 text-gray-300">
                {features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start">
                        <CheckCircle size={18} className={`mr-3 mt-0.5 ${isMain ? 'text-green-500' : 'text-blue-500'} flex-shrink-0`} />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
        </div>

        {/* Botão na parte inferior do card */}
        <Link href="/register" className={`mt-8 w-full text-center py-3 rounded-lg text-lg font-bold transition ${isMain ? 'bg-green-500 text-gray-900 hover:bg-green-400' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            {type === 'Mensal Opcional' ? 'Assinar Suporte' : 'Solicitar Criação'}
        </Link>
    </div>
);


export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white">

            {/* 1. Navbar Pública */}
            <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="flex items-center space-x-3">
                    {/* Renderiza a logo (ajuste de width/height para 120x40 - use os valores reais se tiver certeza) */}
                    <Image
                        src={LOGO_PATH}
                        alt="Logo Elevva Web"
                        width={240}
                        height={80}
                        className="h-16 w-auto object-contain"
                        priority
                    />
                </Link>
                <div className="flex space-x-2 sm:space-x-4 flex-shrink-0">
                    <Link
                        href="/login"
                        className="text-gray-300 hover:text-white transition py-2 px-2 sm:px-4 whitespace-nowrap"
                    >
                        Acessar Painel
                    </Link>
                    {/* Substituindo blue-600/700 pela cor primária da Elevva */}
                    <Link
                        href="/register"
                        className="bg-elevva-primary text-white py-2 px-2 sm:px-4 rounded-md font-semibold hover:bg-elevva-primary/80 transition whitespace-nowrap"
                    >
                        Comece Agora
                    </Link>
                </div>
            </nav>

            {/* 2. Seção Principal (HERO) */}
            <header className="py-20 text-center max-w-6xl mx-auto px-4">
                <h2 className="text-5xl md:text-7xl font-extrabold leading-tight mb-4 text-white">
                    {/* Substituindo blue-400 pela cor secundária (ciano/verde) da Elevva */}
                    <span className="text-elevva-secondary">Eleve</span> Sua Presença Digital.
                </h2>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto">
                    Desenvolvemos sites e web apps modernos, profissionais e focados em resultados para impulsionar o seu negócio.
                </p>
                <Link href="/register" className="inline-block bg-elevva-primary text-white px-10 py-4 rounded-lg text-lg font-bold hover:bg-elevva-primary/80 transition shadow-2xl">
                    Solicitar Orçamento Grátis
                </Link>
                <p className="text-sm text-gray-500 mt-4 flex items-center justify-center">
                    {/* Substituindo green-500 pela cor secundária da Elevva */}
                    <CheckCircle size={16} className='text-elevva-secondary mr-2' />
                    Sistemas robustos com Next.js, TypeScript e Supabase.
                </p>
            </header>

            {/* 3. Seção de Recursos/Benefícios */}
            <section className="py-20 bg-gray-900">
                <div className="max-w-7xl mx-auto px-4">
                    <h3 className="text-4xl font-extrabold text-center text-white mb-12">
                        Por que Escolher a Elevva Web?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Layout}
                            title="Design Moderno e UX"
                            // Substituindo blue-400 pela cor secundária da Elevva
                            description="Interfaces intuitivas e totalmente responsivas, garantindo a melhor experiência em qualquer dispositivo."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Tecnologia de Ponta"
                            description="Utilizamos Next.js, TypeScript e Supabase para performance, segurança e escalabilidade incomparáveis."
                        />
                        <FeatureCard
                            icon={Rocket}
                            title="Foco em Conversão"
                            description="Sites e apps construídos para gerar leads e vendas, transformando visitantes em clientes fiéis."
                        />
                    </div>
                </div>
            </section>

            {/* 4. NOVA SEÇÃO DE PLANOS (Layout Nativo) */}
            <section className="py-20 bg-gray-800">
                <div className="max-w-7xl mx-auto text-center px-4">
                    <h3 className="text-4xl font-extrabold text-white mb-4">
                        Nossos Planos de Crescimento Digital
                    </h3>
                    <p className="text-xl text-gray-400 mb-12">
                        Serviços desenvolvidos com tecnologia de ponta para garantir que sua empresa atinja um próximo nível.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">

                        {/* 1. Plano de Criação */}
                        <PricingCard
                            title="Plano de Criação"
                            type="Pagamento Único"
                            services={[
                                { name: 'Site Institucional (Site Padrão)', price: 'R$ 299,90' },
                                { name: 'Aplicativo Web (Web App)', price: 'R$ 799,90' }
                            ]}
                            features={[
                                'Design Moderno e Responsivo',
                                'Hospedagem (1 ano inclusivo)',
                                'Funcionalidade Customizada (para Web App)',
                                'SEO Básico',
                                'Domínio incluso (seudominio.com)'
                            ]}
                            paymentNote="Pagamento: Em até 10x de R$ 29,99 (sem juros), Pix, Boleto Bancário."
                            isMain={false}
                        />

                        {/* 2. Plano de Manutenção e Suporte (Destacado) */}
                        <PricingCard
                            title="Elevva Suporte Pro"
                            type="Mensal Opcional"
                            services={[
                                { name: 'Investimento Mensal', price: 'R$ 97,00/mês' }
                            ]}
                            features={[
                                'Backups diários de banco de dados',
                                'Monitoração de Cadastro e Login',
                                'Atualização de segurança',
                                'Suporte de velocidade',
                                'Desconto de 15% em novos projetos',
                                'Prioridade no atendimento',
                                'Suporte 24h'
                            ]}
                            paymentNote=""
                            isMain={true}
                        />
                    </div>
                </div>
            </section>


            {/* 5. Footer */}
            <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-800">
                <p>Elevva Web - Desenvolvendo soluções para o seu futuro digital.</p>
                <p className="mt-2">Contato: contato@elevvaweb.com | Telefone: (41)92000-1320</p>
                <p>&copy; {new Date().getFullYear()} Elevva Web. Todos os direitos reservados.</p>
            </footer>

            {/* Botão Flutuante do WhatsApp (Já corrigido) */}
            <WhatsAppButton />
        </div>
    );
}
