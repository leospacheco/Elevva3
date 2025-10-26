// src/components/common/ListHeader.tsx
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

interface ListHeaderProps {
    title: string;
    description: string;
    // Opcional, para botões como "Abrir Chamado" ou "Novo Orçamento"
    buttonText?: string; 
    buttonHref?: string; 
    children?: React.ReactNode; // Para filtros adicionais
}

export const ListHeader: React.FC<ListHeaderProps> = ({ 
    title, 
    description, 
    buttonText, 
    buttonHref, 
    children 
}) => {
    return (
        <div className="mb-8 border-b border-gray-700 pb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">{title}</h1>
                    <p className="text-gray-400 mt-1">{description}</p>
                </div>
                {buttonText && buttonHref && (
                    <Link href={buttonHref} className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition flex-shrink-0">
                        <Plus size={20} className="mr-2" /> {buttonText}
                    </Link>
                )}
            </div>

            <div className="flex space-x-4 items-center mt-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        placeholder={`Buscar ${title}...`}
                        className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                {children}
            </div>
        </div>
    );
};
