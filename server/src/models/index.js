
const { sequelize } = require('../config/database');
const User = require('./user.model');
const Job = require('./job.model');
const Comment = require('./comment.model');
const Reply = require('./reply.model');
const Chat = require('./chat.model');
const Message = require('./message.model');

// Asociaciones de trabajos
Job.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Job, { foreignKey: 'userId' });

// Asociaciones de comentarios
Comment.belongsTo(User, { foreignKey: 'userId' });
Comment.belongsTo(Job, { foreignKey: 'jobId' });
User.hasMany(Comment, { foreignKey: 'userId' });
Job.hasMany(Comment, { foreignKey: 'jobId' });

// Asociaciones de respuestas
Reply.belongsTo(User, { foreignKey: 'userId' });
Reply.belongsTo(Comment, { foreignKey: 'commentId' });
User.hasMany(Reply, { foreignKey: 'userId' });
Comment.hasMany(Reply, { foreignKey: 'commentId' });

// Asociaciones de chat
Chat.belongsToMany(User, { 
  through: 'ChatParticipants', 
  as: 'participants'
});
User.belongsToMany(Chat, { 
  through: 'ChatParticipants', 
  as: 'chats'
});

// Asociaciones de mensajes
Message.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});
Message.belongsTo(Chat, { 
  foreignKey: 'chatId'
});
Chat.hasMany(Message, { 
  foreignKey: 'chatId', 
  as: 'messages'
});

module.exports = {
  sequelize,
  User,
  Job,
  Comment,
  Reply,
  Chat,
  Message
};
