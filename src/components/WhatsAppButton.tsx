// src/components/WhatsAppButton.tsx
'use client'; // <-- ADICIONADO PARA MARCAR COMO CLIENT COMPONENT

import { MessageCircle, X } from 'lucide-react';
import { useState } from 'react';

// Seu número com código do país (ex: 5541999999999)
const WHATSAPP_NUMBER = '5541920001320'; 
const MESSAGE = 'Olá! Gostaria de um orçamento para a criação de um site para minha empresa. Meu nome é...';

export const WhatsAppButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {isOpen ? (
                <div className="bg-gray-800 p-4 rounded-lg shadow-2xl w-64">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-white font-semibold">Elevva Web</h4>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">
                        Entre em contato agora para iniciar seu projeto!
                    </p>
                    <a 
                        href={whatsappLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center bg-green-500 text-gray-900 font-bold py-2 rounded-md hover:bg-green-600 transition"
                    >
                        <MessageCircle size={20} className="mr-2" /> 
                        Fale Conosco
                    </a>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
                    aria-label="Fale Conosco pelo WhatsApp"
                >
                    <MessageCircle size={28} />
                </button>
            )}
        </div>
    );
};
