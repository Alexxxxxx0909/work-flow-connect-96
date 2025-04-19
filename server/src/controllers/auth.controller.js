
const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Registrar un nuevo usuario
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Verificar si el email ya está en uso
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'El correo electrónico ya está registrado' 
      });
    }
    
    // Crear nuevo usuario
    const user = await User.create({
      name,
      email,
      password
    });
    
    // Generar token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });
    
    return res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: user.toJSON(),
      token
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

/**
 * Iniciar sesión
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Actualizar estado de conexión
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();
    
    // Generar token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });
    
    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: user.toJSON(),
      token
    });
    
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Cerrar sesión
 */
exports.logout = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Actualizar estado de conexión
    await User.update(
      { isOnline: false, lastSeen: new Date() },
      { where: { id: userId } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente'
    });
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message
    });
  }
};

/**
 * Verificar token (para mantener sesión)
 */
exports.verifySession = async (req, res) => {
  try {
    // El middleware verifyToken ya verificó el token y añadió el usuario al request
    const user = req.user;
    
    return res.status(200).json({
      success: true,
      user: user.toJSON()
    });
    
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar sesión',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  verifySession
};
