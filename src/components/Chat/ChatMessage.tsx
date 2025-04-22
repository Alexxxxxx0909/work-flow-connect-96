
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageType } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: MessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { currentUser } = useAuth();
  const isOwnMessage = message.userId === currentUser?.id;
  
  const formattedTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: es });
  };
  
  return (
    <div
      className={cn(
        "flex items-end mb-4 gap-2",
        isOwnMessage ? "flex-row-reverse" : ""
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.user.photoURL} />
          <AvatarFallback className="bg-wfc-purple text-white">
            {message.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          "px-3 py-2 rounded-lg max-w-[70%] break-words",
          isOwnMessage
            ? "bg-wfc-purple text-white rounded-br-none"
            : "bg-gray-100 dark:bg-gray-800 rounded-bl-none"
        )}
      >
        {!isOwnMessage && (
          <div className="text-xs font-semibold mb-1">{message.user.name}</div>
        )}
        <div>{message.content}</div>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-70">
            {formattedTime(message.createdAt)}
          </span>
          {isOwnMessage && (
            <span className="text-xs opacity-70">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
