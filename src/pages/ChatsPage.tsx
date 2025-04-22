
import React, { useState, useEffect } from 'react';
import { UserSearch } from '@/components/Chat/UserSearch';
import { ChatList } from '@/components/Chat/ChatList';
import { ChatView } from '@/components/Chat/ChatView';
import { useChat } from '@/contexts/ChatContext';
import { useIsMobile } from '@/hooks/use-mobile';

const ChatsPage: React.FC = () => {
  const { currentChat, fetchChats } = useChat();
  const isMobile = useIsMobile();
  const [showChatList, setShowChatList] = useState(true);
  
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
  useEffect(() => {
    // En móvil, cuando se selecciona un chat, mostrar la vista del chat
    if (isMobile && currentChat) {
      setShowChatList(false);
    }
  }, [currentChat, isMobile]);
  
  return (
    <div className="flex h-screen bg-background">
      {/* Barra lateral con lista de chats (se oculta en móvil cuando hay un chat seleccionado) */}
      {(!isMobile || showChatList) && (
        <div className={`${isMobile ? 'w-full' : 'w-1/3 border-r'} h-full flex flex-col`}>
          <div className="p-3">
            <h1 className="text-xl font-bold mb-4">Mensajes</h1>
            <UserSearch />
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatList />
          </div>
        </div>
      )}
      
      {/* Área principal del chat (ocupa toda la pantalla en móvil cuando hay un chat seleccionado) */}
      {(!isMobile || !showChatList) && (
        <div className={`${isMobile ? 'w-full' : 'w-2/3'} h-full`}>
          <ChatView 
            mobile={isMobile} 
            onBack={() => setShowChatList(true)} 
          />
        </div>
      )}
    </div>
  );
};

export default ChatsPage;
