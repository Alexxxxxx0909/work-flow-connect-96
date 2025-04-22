
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  // Inicializar y conectar el socket
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const socketInstance = io('http://localhost:5000', {
      auth: { token }
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO conectado');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket.IO desconectado');
      setConnected(false);
    });

    socketInstance.on('error', (error) => {
      console.error('Error de Socket.IO:', error);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  // Función para enviar un mensaje
  const sendMessage = useCallback((chatId: string, content: string) => {
    if (socket && connected) {
      socket.emit('send_message', { chatId, content });
      return true;
    }
    return false;
  }, [socket, connected]);

  // Función para indicar que el usuario está escribiendo
  const sendTyping = useCallback((chatId: string) => {
    if (socket && connected) {
      socket.emit('typing', { chatId });
    }
  }, [socket, connected]);

  // Función para marcar mensajes como leídos
  const markAsRead = useCallback((chatId: string) => {
    if (socket && connected) {
      socket.emit('mark_read', { chatId });
    }
  }, [socket, connected]);

  // Función para unirse a una sala de chat
  const joinChat = useCallback((chatId: string) => {
    if (socket && connected) {
      socket.emit('join_chat', { chatId });
    }
  }, [socket, connected]);

  // Registrar eventos para escuchar
  const onNewMessage = useCallback((callback: (message: any) => void) => {
    if (socket) {
      socket.on('new_message', callback);
    }
    return () => {
      if (socket) socket.off('new_message', callback);
    };
  }, [socket]);

  const onUserTyping = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_typing', callback);
    }
    return () => {
      if (socket) socket.off('user_typing', callback);
    };
  }, [socket]);

  const onMessagesRead = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('messages_read', callback);
    }
    return () => {
      if (socket) socket.off('messages_read', callback);
    };
  }, [socket]);

  const onUserStatusChange = useCallback((callback: (data: any) => void) => {
    if (socket) {
      socket.on('user_status_change', callback);
    }
    return () => {
      if (socket) socket.off('user_status_change', callback);
    };
  }, [socket]);

  return {
    connected,
    sendMessage,
    sendTyping,
    markAsRead,
    joinChat,
    onNewMessage,
    onUserTyping,
    onMessagesRead,
    onUserStatusChange
  };
};
