/** @type {import('next').NextConfig} */

// Importa a biblioteca 'dotenv' para garantir que o .env.local seja lido no momento da configuração
const dotenv = require('dotenv');
const path = require('path');

// Carrega as variáveis de ambiente do .env.local
const envPath = path.resolve(__dirname, '.env.local');
dotenv.config({ path: envPath });


const nextConfig = {
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Configuração de Imagens (já estava aqui)
    images: {
        remotePatterns: [
            // Se você usar URLs externas, adicione-as aqui.
        ],
    },

    // FORÇA O CARREGAMENTO DAS VARIÁVEIS PÚBLICAS/DE SERVIDOR NO PROCESSO
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
        // Adicione outras variáveis aqui se necessário
    },

    // Adicione esta opção se tiver problemas com a otimização de imagem local
    // Caso contrário, pode ser omitida.
    // output: 'standalone', 
};

module.exports = nextConfig;
