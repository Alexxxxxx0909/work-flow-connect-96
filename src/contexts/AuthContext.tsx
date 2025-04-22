
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, userService } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

// Tipo para usuario actual
export type CurrentUserType = {
  id: string;
  name: string;
  email: string;
  photoURL: string;
  role: string;
  isOnline: boolean;
  lastSeen: Date;
} | null;

// Interfaz para el contexto de autenticación
interface AuthContextType {
  currentUser: CurrentUserType;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateCurrentUser: (userData: Partial<CurrentUserType>) => Promise<any>;
}

// Crear el contexto
const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  token: null,
  loading: true,
  login: () => Promise.resolve(),
  register: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  updateCurrentUser: () => Promise.resolve()
});

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUserType>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wfc_token'));
  const [loading, setLoading] = useState(true);

  // Verificar el token almacenado y obtener información del usuario
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('wfc_token');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }
      
      setToken(storedToken);
      
      try {
        // Obtener información del usuario actual
        const { data } = await userService.getCurrentUser();
        setCurrentUser(data.user);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // Si hay un error, eliminar el token
        localStorage.removeItem('wfc_token');
        setToken(null);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Función para iniciar sesión
  const login = async (email: string, password: string) => {
    try {
      const { data } = await authService.login(email, password);
      
      // Guardar el token
      localStorage.setItem('wfc_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
        description: message
      });
      throw error;
    }
  };

  // Función para registrarse
  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await authService.register(name, email, password);
      
      // Guardar el token
      localStorage.setItem('wfc_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al registrar';
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: message
      });
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Eliminar el token y el usuario actual
      localStorage.removeItem('wfc_token');
      setToken(null);
      setCurrentUser(null);
    }
  };

  // Función para actualizar el usuario actual
  const updateCurrentUser = async (userData: Partial<CurrentUserType>) => {
    try {
      const { data } = await userService.updateCurrentUser(userData);
      setCurrentUser(data.user);
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al actualizar perfil';
      toast({
        variant: "destructive",
        title: "Error",
        description: message
      });
      throw error;
    }
  };

  // Valor del contexto
  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    updateCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
