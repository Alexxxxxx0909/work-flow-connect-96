
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat, ChatType } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatHeaderProps {
  chat: ChatType;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chat }) => {
  const { currentUser } = useAuth();
  
  // Determinar nombre y foto para mostrar
  const getChatNameAndPhoto = () => {
    if (chat.isGroup) {
      return {
        name: chat.name || 'Grupo sin nombre',
        photoURL: '',
        isOnline: false,
        lastSeen: null
      };
    }
    
    // Para chats privados, mostrar el otro usuario
    const otherUser = chat.participants.find(p => p.id !== currentUser?.id);
    
    if (otherUser) {
      return {
        name: otherUser.name,
        photoURL: otherUser.photoURL,
        isOnline: otherUser.isOnline,
        lastSeen: otherUser.lastSeen
      };
    }
    
    return {
      name: 'Chat',
      photoURL: '',
      isOnline: false,
      lastSeen: null
    };
  };
  
  const { name, photoURL, isOnline, lastSeen } = getChatNameAndPhoto();
  
  // Formatear la última vez visto
  const formatLastSeen = (lastSeenDate: string) => {
    if (!lastSeenDate) return '';
    
    const date = new Date(lastSeenDate);
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };
  
  return (
    <div className="flex items-center px-4 py-3 border-b">
      <Avatar className="h-10 w-10 mr-3">
        <AvatarImage src={photoURL} />
        <AvatarFallback className="bg-wfc-purple text-white">
          {name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h3 className="font-medium">{name}</h3>
        <p className="text-xs text-gray-500">
          {isOnline ? (
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              En línea
            </span>
          ) : (
            lastSeen ? `Última vez ${formatLastSeen(lastSeen)}` : ''
          )}
        </p>
      </div>
    </div>
  );
};
