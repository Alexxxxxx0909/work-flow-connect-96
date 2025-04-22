
import axios from 'axios';

// Create an axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Asegúrate de que este es el puerto correcto del servidor
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir el token de autenticación en las solicitudes
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('wfc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) => 
    api.post('/auth/register', { name, email, password }),
  
  logout: () => 
    api.post('/auth/logout')
};

// User services
export const userService = {
  getCurrentUser: () => 
    api.get('/users/me'),
  
  getUserProfile: (userId: string) => 
    api.get(`/users/profile/${userId}`),
  
  updateCurrentUser: (userData: any) => 
    api.put('/users/me', userData),
  
  searchUsers: (query: string = '') => 
    api.get('/users/search', { params: { query } }),
  
  getAllUsers: () => 
    api.get('/users/all')
};

// Chat services
export const chatService = {
  getChats: () => 
    api.get('/chats'),
  
  getChat: (chatId: string) => 
    api.get(`/chats/${chatId}`),
  
  createChat: (participantIds: string[], name?: string, isGroup: boolean = false) => 
    api.post('/chats', { participantIds, name, isGroup }),
  
  sendMessage: (chatId: string, content: string) => 
    api.post(`/chats/${chatId}/messages`, { content }),
  
  addParticipant: (chatId: string, userId: string) => 
    api.post(`/chats/${chatId}/participants`, { userId }),
  
  leaveChat: (chatId: string) => 
    api.delete(`/chats/${chatId}/leave`)
};

export default api;
