
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatType } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const ChatList: React.FC = () => {
  const { chats, currentChat, selectChat, loadingChats } = useChat();
  const { currentUser } = useAuth();
  
  const getChatNameAndPhoto = (chat: ChatType) => {
    if (chat.isGroup) {
      return {
        name: chat.name || 'Grupo sin nombre',
        photoURL: '',
        isOnline: false
      };
    }
    
    // Para chats privados, mostrar el otro usuario
    const otherUser = chat.participants.find(p => p.id !== currentUser?.id);
    
    if (otherUser) {
      return {
        name: otherUser.name,
        photoURL: otherUser.photoURL,
        isOnline: otherUser.isOnline
      };
    }
    
    return {
      name: 'Chat',
      photoURL: '',
      isOnline: false
    };
  };
  
  const getLastMessage = (chat: ChatType) => {
    if (chat.messages && chat.messages.length > 0) {
      const lastMessage = chat.messages[0];
      const isSender = lastMessage.userId === currentUser?.id;
      const shortContent = lastMessage.content.length > 30 
        ? `${lastMessage.content.substring(0, 30)}...` 
        : lastMessage.content;
      
      return {
        content: isSender ? `Tú: ${shortContent}` : shortContent,
        date: lastMessage.createdAt 
          ? format(new Date(lastMessage.createdAt), 'dd/MM/yy HH:mm', { locale: es })
          : ''
      };
    }
    
    return { content: 'No hay mensajes', date: '' };
  };
  
  if (loadingChats) {
    return <div className="p-4 text-center">Cargando chats...</div>;
  }
  
  if (chats.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No tienes chats activos.
        <br />
        Inicia una nueva conversación.
      </div>
    );
  }
  
  return (
    <div className="overflow-y-auto">
      {chats.map(chat => {
        const { name, photoURL, isOnline } = getChatNameAndPhoto(chat);
        const { content, date } = getLastMessage(chat);
        const isActive = currentChat?.id === chat.id;
        
        return (
          <div
            key={chat.id}
            onClick={() => selectChat(chat.id)}
            className={cn(
              "flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
              isActive ? "bg-gray-100 dark:bg-gray-800" : ""
            )}
          >
            <Avatar className="h-12 w-12 mr-3 relative">
              <AvatarImage src={photoURL} />
              <AvatarFallback className="bg-wfc-purple text-white">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
              
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <h3 className="font-medium truncate">{name}</h3>
                <span className="text-xs text-gray-500">{date}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
