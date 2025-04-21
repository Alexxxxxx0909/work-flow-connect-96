const { User, Job } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

/**
 * Obtener perfil de usuario
 */
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'photoURL', 'isOnline', 'lastSeen']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener perfil de usuario',
      error: error.message
    });
  }
};

/**
 * Obtener usuario actual
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'photoURL', 'isOnline', 'lastSeen']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario actual',
      error: error.message
    });
  }
};

/**
 * Actualizar usuario actual
 */
exports.updateCurrentUser = async (req, res) => {
  try {
    const { name, email, password, role, photoURL } = req.body;
    const userId = req.user.id;

    // Buscar usuario
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos
    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.photoURL = photoURL || user.photoURL;

    // Actualizar contraseña si se proporciona
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Guardar cambios
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente',
      user
    });
  } catch (error) {
    console.error('Error al actualizar usuario actual:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario actual',
      error: error.message
    });
  }
};

/**
 * Obtener todos los usuarios
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'photoURL', 'isOnline', 'lastSeen']
    });
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

/**
 * Buscar usuarios por nombre
 */
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    let whereClause = {};
    
    if (query) {
      whereClause.name = {
        [Op.iLike]: `%${query}%`
      };
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'role', 'photoURL', 'isOnline', 'lastSeen']
    });
    
    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
};
