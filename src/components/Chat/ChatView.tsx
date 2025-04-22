
import React, { useEffect, useRef } from 'react';
import { useChat, ChatType } from '@/contexts/ChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface ChatViewProps {
  mobile?: boolean;
  onBack?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ mobile, onBack }) => {
  const { currentChat, loadingMessages, typingUsers } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentChat?.messages]);
  
  if (!currentChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400">
          Selecciona un chat para empezar a conversar
        </h3>
        <p className="text-gray-400 dark:text-gray-500 mt-2 text-center">
          O busca un usuario para iniciar una nueva conversación
        </p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {mobile && (
        <div className="p-2 border-b">
          <Button variant="outline" size="sm" onClick={onBack}>
            Volver a la lista
          </Button>
        </div>
      )}
      
      <ChatHeader chat={currentChat} />
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <p>Cargando mensajes...</p>
          </div>
        ) : (
          <>
            {/* Mensajes */}
            {currentChat.messages && currentChat.messages.length > 0 ? (
              <>
                {currentChat.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 dark:text-gray-400">
                  No hay mensajes. ¡Envía el primero!
                </p>
              </div>
            )}
            
            {/* Indicador de "escribiendo" */}
            {typingUsers[currentChat.id]?.length > 0 && (
              <div className="text-xs text-gray-500 italic mb-2">
                {typingUsers[currentChat.id].join(', ')} {typingUsers[currentChat.id].length === 1 ? 'está' : 'están'} escribiendo...
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <ChatInput />
    </div>
  );
};
