
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { chatService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useSocket } from '@/hooks/useSocket';

// Tipos para los mensajes y chats
export type MessageType = {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  read: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    photoURL: string;
  };
};

export type ChatParticipantType = {
  id: string;
  name: string;
  photoURL: string;
  isOnline: boolean;
  lastSeen: string;
};

export type ChatType = {
  id: string;
  name: string;
  isGroup: boolean;
  lastMessageAt: string;
  participants: ChatParticipantType[];
  messages: MessageType[];
};

// Interfaz para el contexto de chat
interface ChatContextType {
  chats: ChatType[];
  currentChat: ChatType | null;
  loadingChats: boolean;
  loadingMessages: boolean;
  typingUsers: Record<string, string[]>;
  fetchChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createChat: (participantIds: string[], name?: string, isGroup?: boolean) => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  handleTyping: () => void;
}

// Crear el contexto
const ChatContext = createContext<ChatContextType>({
  chats: [],
  currentChat: null,
  loadingChats: false,
  loadingMessages: false,
  typingUsers: {},
  fetchChats: () => Promise.resolve(),
  selectChat: () => Promise.resolve(),
  createChat: () => Promise.resolve(),
  sendMessage: () => Promise.resolve(false),
  handleTyping: () => {}
});

// Hook personalizado para usar el contexto
export const useChat = () => useContext(ChatContext);

// Proveedor del contexto
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  
  const { currentUser, token } = useAuth();
  const socket = useSocket();

  // Obtener todos los chats del usuario
  const fetchChats = useCallback(async () => {
    if (!currentUser || !token) return;
    
    setLoadingChats(true);
    try {
      const { data } = await chatService.getChats();
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error al obtener chats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar tus chats"
      });
    } finally {
      setLoadingChats(false);
    }
  }, [currentUser, token]);

  // Seleccionar un chat y cargar sus mensajes
  const selectChat = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await chatService.getChat(chatId);
      setCurrentChat(data.chat);
      socket.joinChat(chatId);
      socket.markAsRead(chatId);
    } catch (error) {
      console.error('Error al cargar chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el chat seleccionado"
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [socket]);

  // Crear un nuevo chat
  const createChat = useCallback(async (participantIds: string[], name?: string, isGroup: boolean = false) => {
    try {
      const { data } = await chatService.createChat(participantIds, name, isGroup);
      
      // Actualizar la lista de chats
      setChats(prevChats => {
        // Si el chat ya existe, no lo añadimos nuevamente
        if (prevChats.some(chat => chat.id === data.chat.id)) {
          return prevChats;
        }
        return [data.chat, ...prevChats];
      });
      
      // Seleccionar el chat recién creado
      setCurrentChat(data.chat);
      socket.joinChat(data.chat.id);
      
      toast({
        title: "Chat creado",
        description: "Se ha creado el chat correctamente"
      });
    } catch (error) {
      console.error('Error al crear chat:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el chat"
      });
    }
  }, [socket]);

  // Enviar un mensaje al chat actual
  const sendMessage = useCallback(async (content: string) => {
    if (!currentChat || !content.trim() || !currentUser) {
      return false;
    }
    
    try {
      // Primero intentamos enviar mediante Socket.IO
      const sent = socket.sendMessage(currentChat.id, content);
      
      if (!sent) {
        // Si falla el socket, usar HTTP como respaldo
        const { data } = await chatService.sendMessage(currentChat.id, content);
        
        // Actualizar el chat actual con el nuevo mensaje
        setCurrentChat(prevChat => {
          if (!prevChat) return null;
          
          const newChat = { ...prevChat };
          newChat.messages = [data.chatMessage, ...newChat.messages];
          return newChat;
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el mensaje"
      });
      return false;
    }
  }, [currentChat, currentUser, socket]);

  // Manejar la escritura (typing)
  const handleTyping = useCallback(() => {
    if (currentChat) {
      socket.sendTyping(currentChat.id);
    }
  }, [currentChat, socket]);

  // Cargar los chats cuando el usuario inicia sesión
  useEffect(() => {
    if (currentUser) {
      fetchChats();
    } else {
      setChats([]);
      setCurrentChat(null);
    }
  }, [currentUser, fetchChats]);

  // Escuchar eventos de Socket.IO
  useEffect(() => {
    if (!socket.connected) return;

    // Escuchar nuevos mensajes
    const messageUnsubscribe = socket.onNewMessage((message: MessageType) => {
      // Actualizar el chat actual si es el mismo
      if (currentChat && message.chatId === currentChat.id) {
        setCurrentChat(prevChat => {
          if (!prevChat) return null;
          return {
            ...prevChat,
            messages: [message, ...prevChat.messages]
          };
        });
        socket.markAsRead(message.chatId);
      }
      
      // Actualizar la lista de chats
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.id === message.chatId) {
            // Colocar el chat con nuevo mensaje al principio
            return {
              ...chat,
              messages: [message, ...(chat.messages || [])],
              lastMessageAt: message.createdAt
            };
          }
          return chat;
        })
        // Ordenar los chats por el último mensaje
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      );
    });
    
    // Escuchar usuario escribiendo
    const typingUnsubscribe = socket.onUserTyping((data: { chatId: string, userId: string, userName: string }) => {
      if (data.userId === currentUser?.id) return;
      
      setTypingUsers(prev => {
        const chatTypers = prev[data.chatId] || [];
        
        if (!chatTypers.includes(data.userName)) {
          return {
            ...prev,
            [data.chatId]: [...chatTypers, data.userName]
          };
        }
        return prev;
      });
      
      // Limpiar el estado de typing después de un tiempo
      setTimeout(() => {
        setTypingUsers(prev => {
          const chatTypers = prev[data.chatId] || [];
          return {
            ...prev,
            [data.chatId]: chatTypers.filter(name => name !== data.userName)
          };
        });
      }, 3000);
    });
    
    // Escuchar mensajes leídos
    const readUnsubscribe = socket.onMessagesRead(
      (data: { chatId: string, userId: string }) => {
        if (currentChat?.id === data.chatId) {
          setCurrentChat(prevChat => {
            if (!prevChat) return null;
            
            // Actualizar el estado de lectura de los mensajes
            const updatedMessages = prevChat.messages.map(msg => {
              if (msg.userId !== data.userId && !msg.read) {
                return { ...msg, read: true };
              }
              return msg;
            });
            
            return {
              ...prevChat,
              messages: updatedMessages
            };
          });
        }
      }
    );
    
    // Escuchar cambios de estado de usuarios
    const statusUnsubscribe = socket.onUserStatusChange((data: { userId: string, isOnline: boolean, lastSeen: string }) => {
      // Actualizar estado de los participantes en los chats
      setChats(prevChats =>
        prevChats.map(chat => ({
          ...chat,
          participants: chat.participants.map(participant =>
            participant.id === data.userId
              ? { ...participant, isOnline: data.isOnline, lastSeen: data.lastSeen }
              : participant
          )
        }))
      );
      
      // Actualizar estado de los participantes en el chat actual
      if (currentChat) {
        setCurrentChat(prevChat => {
          if (!prevChat) return null;
          
          return {
            ...prevChat,
            participants: prevChat.participants.map(participant =>
              participant.id === data.userId
                ? { ...participant, isOnline: data.isOnline, lastSeen: data.lastSeen }
                : participant
            )
          };
        });
      }
    });
    
    // Limpiar suscripciones cuando el componente se desmonte
    return () => {
      messageUnsubscribe();
      typingUnsubscribe();
      readUnsubscribe();
      statusUnsubscribe();
    };
  }, [socket, currentChat, currentUser]);

  // Valor del contexto
  const value = {
    chats,
    currentChat,
    loadingChats,
    loadingMessages,
    typingUsers,
    fetchChats,
    selectChat,
    createChat,
    sendMessage,
    handleTyping
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
