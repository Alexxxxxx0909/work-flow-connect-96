
const { Chat, User, Message } = require('../models');
const { Op } = require('sequelize');

/**
 * Crear un nuevo chat
 */
exports.createChat = async (req, res) => {
  try {
    const { participantIds, name, isGroup } = req.body;
    const userId = req.user.id;
    
    // Asegurarse de que el usuario actual está incluido en los participantes
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }
    
    // Para chats privados (no grupos), verificar si ya existe un chat entre los usuarios
    if (!isGroup && participantIds.length === 2) {
      // Buscar todos los chats privados del usuario actual
      const userChats = await Chat.findAll({
        include: [
          {
            model: User,
            as: 'participants',
            where: {
              id: userId
            }
          }
        ],
        where: { isGroup: false }
      });
      
      // Filtrar para encontrar chats donde el otro participante también está presente
      for (const chat of userChats) {
        const participants = await chat.getParticipants();
        
        if (participants.length === 2 && 
            participants.some(p => p.id === participantIds[0]) && 
            participants.some(p => p.id === participantIds[1])) {
          
          // Ya existe un chat privado entre estos usuarios, devolverlo
          const chatWithDetails = await Chat.findByPk(chat.id, {
            include: [
              {
                model: User,
                as: 'participants',
                attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
              },
              {
                model: Message,
                as: 'messages',
                limit: 20,
                order: [['createdAt', 'DESC']],
                include: [
                  {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'photoURL']
                  }
                ]
              }
            ]
          });
          
          return res.status(200).json({
            success: true,
            message: 'Chat existente encontrado',
            chat: chatWithDetails
          });
        }
      }
    }
    
    // Crear nuevo chat
    const chat = await Chat.create({
      name: isGroup ? name : '',
      isGroup: !!isGroup
    });
    
    // Añadir participantes
    await Promise.all(participantIds.map(id => chat.addParticipant(id)));
    
    // Obtener chat con detalles de participantes
    const chatWithDetails = await Chat.findByPk(chat.id, {
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Chat creado correctamente',
      chat: chatWithDetails
    });
    
  } catch (error) {
    console.error('Error al crear chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear chat',
      error: error.message
    });
  }
};

/**
 * Obtener todos los chats del usuario
 */
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar todos los chats donde el usuario es participante
    const chats = await Chat.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'photoURL']
            }
          ]
        }
      ],
      order: [['lastMessageAt', 'DESC']],
      // Filtrar chats donde el usuario actual es participante
      include: [
        {
          model: User,
          as: 'participants',
          where: {
            id: userId
          },
          attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'photoURL']
            }
          ]
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      chats
    });
    
  } catch (error) {
    console.error('Error al obtener chats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener chats',
      error: error.message
    });
  }
};

/**
 * Obtener un chat específico con mensajes
 */
exports.getChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    // Buscar chat
    const chat = await Chat.findByPk(chatId, {
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
        },
        {
          model: Message,
          as: 'messages',
          limit: 50,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'photoURL']
            }
          ]
        }
      ]
    });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat no encontrado'
      });
    }
    
    // Verificar que el usuario es participante
    const participants = await chat.getParticipants();
    const isParticipant = participants.some(p => p.id === userId);
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este chat'
      });
    }
    
    // Marcar mensajes como leídos
    await Message.update(
      { read: true },
      {
        where: {
          chatId,
          userId: { [Op.ne]: userId },
          read: false
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      chat
    });
    
  } catch (error) {
    console.error('Error al obtener chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener chat',
      error: error.message
    });
  }
};

/**
 * Enviar un mensaje
 */
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    // Verificar que el chat existe
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat no encontrado'
      });
    }
    
    // Verificar que el usuario es participante
    const participants = await chat.getParticipants();
    const isParticipant = participants.some(p => p.id === userId);
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este chat'
      });
    }
    
    // Crear mensaje
    const message = await Message.create({
      content,
      chatId,
      userId
    });
    
    // Actualizar lastMessageAt del chat
    chat.lastMessageAt = new Date();
    await chat.save();
    
    // Cargar mensaje con información del usuario
    const messageWithUser = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'photoURL']
        }
      ]
    });
    
    return res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente',
      chatMessage: messageWithUser
    });
    
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
};

/**
 * Añadir participante a un chat grupal
 */
exports.addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId: participantId } = req.body;
    const requestUserId = req.user.id;
    
    // Verificar que el chat existe
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat no encontrado'
      });
    }
    
    // Verificar que es un chat grupal
    if (!chat.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden añadir participantes a chats grupales'
      });
    }
    
    // Verificar que el usuario que hace la solicitud es participante
    const participants = await chat.getParticipants();
    const isRequestUserParticipant = participants.some(p => p.id === requestUserId);
    
    if (!isRequestUserParticipant) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este chat'
      });
    }
    
    // Verificar que el usuario a añadir existe
    const userToAdd = await User.findByPk(participantId);
    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Verificar si el usuario ya es participante
    const isAlreadyParticipant = participants.some(p => p.id === participantId);
    
    if (isAlreadyParticipant) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya es participante del chat'
      });
    }
    
    // Añadir participante
    await chat.addParticipant(participantId);
    
    // Crear mensaje del sistema
    await Message.create({
      content: `${req.user.name} ha añadido a ${userToAdd.name} al chat`,
      chatId,
      userId: null // ID especial para mensajes del sistema
    });
    
    // Obtener chat actualizado con participantes
    const updatedChat = await Chat.findByPk(chatId, {
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'name', 'photoURL', 'isOnline', 'lastSeen']
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      message: 'Participante añadido correctamente',
      chat: updatedChat
    });
    
  } catch (error) {
    console.error('Error al añadir participante:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al añadir participante',
      error: error.message
    });
  }
};

/**
 * Abandonar un chat
 */
exports.leaveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    
    // Verificar que el chat existe
    const chat = await Chat.findByPk(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat no encontrado'
      });
    }
    
    // Verificar que el usuario es participante
    const participants = await chat.getParticipants();
    const isParticipant = participants.some(p => p.id === userId);
    
    if (!isParticipant) {
      return res.status(400).json({
        success: false,
        message: 'No eres participante de este chat'
      });
    }
    
    // Para chats privados, no se puede abandonar, se debe eliminar
    if (!chat.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'No se puede abandonar un chat privado'
      });
    }
    
    // Eliminar al usuario de los participantes
    await chat.removeParticipant(userId);
    
    // Crear mensaje del sistema
    await Message.create({
      content: `${req.user.name} ha abandonado el chat`,
      chatId,
      userId: null
    });
    
    return res.status(200).json({
      success: true,
      message: 'Has abandonado el chat correctamente'
    });
    
  } catch (error) {
    console.error('Error al abandonar chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al abandonar chat',
      error: error.message
    });
  }
};
