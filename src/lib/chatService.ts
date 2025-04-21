
/**
 * Servicio de Chat
 */

import { apiRequest } from './api';
import { ChatType, MessageType } from "@/contexts/ChatContext";
import { toast } from '@/components/ui/use-toast';

/**
 * Obtener todos los chats para un usuario
 */
export const getChats = async (): Promise<ChatType[]> => {
  try {
    const response = await apiRequest('/chats');
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener chats');
    }
    return response.chats || [];
  } catch (error) {
    console.error('Error al obtener chats:', error);
    // No lanzar error si no hay chats, solo devolver array vacío
    return [];
  }
};

/**
 * Crear un nuevo chat
 */
export const createChat = async (participantIds: string[], name = ""): Promise<ChatType> => {
  try {
    if (!participantIds || participantIds.length === 0) {
      throw new Error('Se requieren participantes para crear un chat');
    }
    
    console.log("Creando chat con participantes:", participantIds, "nombre:", name);
    
    const response = await apiRequest('/chats', 'POST', {
      participantIds,
      name,
      isGroup: participantIds.length > 2 || !!name
    });

    if (!response.success) {
      console.error("Error en respuesta del servidor:", response);
      throw new Error(response.message || 'Error al crear chat');
    }
    
    return response.chat;
  } catch (error) {
    console.error('Error al crear chat:', error);
    throw error;
  }
};

/**
 * Enviar un mensaje a un chat
 */
export const sendMessage = async (chatId: string, content: string): Promise<MessageType> => {
  try {
    if (!chatId || !content.trim()) {
      throw new Error('Se requiere un ID de chat y contenido para enviar un mensaje');
    }
    
    const response = await apiRequest(`/chats/${chatId}/messages`, 'POST', {
      content
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al enviar mensaje');
    }

    return response.chatMessage;
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw error;
  }
};

/**
 * Añadir un participante a un chat existente
 */
export const addParticipantToChat = async (chatId: string, participantId: string): Promise<boolean> => {
  try {
    if (!chatId || !participantId) {
      throw new Error('Se requiere un ID de chat y un ID de participante');
    }
    
    const response = await apiRequest(`/chats/${chatId}/participants`, 'POST', {
      userId: participantId
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al añadir participante');
    }

    return true;
  } catch (error) {
    console.error('Error al añadir participante:', error);
    return false;
  }
};

/**
 * Obtener un chat por ID
 */
export const getChatById = async (chatId: string): Promise<ChatType | null> => {
  try {
    if (!chatId) {
      throw new Error('Se requiere un ID de chat');
    }
    
    const response = await apiRequest(`/chats/${chatId}`);
    if (!response.success) {
      throw new Error(response.message || 'Error al obtener chat');
    }
    return response.chat;
  } catch (error) {
    console.error('Error al obtener chat:', error);
    return null;
  }
};

// Mapa de callbacks para simular listeners en tiempo real
const listeners: ((chats: ChatType[]) => void)[] = [];

/**
 * Configurar un listener para cambios en los chats
 * Esta función simula la funcionalidad en tiempo real que antes proporcionaba Firebase
 */
export const setupChatListener = (callback: (chats: ChatType[]) => void) => {
  listeners.push(callback);
  
  // Llamar inmediatamente con los datos actuales
  getChats().then(chats => {
    callback(chats);
  }).catch(error => {
    console.error("Error al obtener chats iniciales:", error);
    callback([]);
  });
  
  // Devolver una función para eliminar el listener
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
};
