
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userService } from '@/services/api';
import { useChat } from '@/contexts/ChatContext';
import { Search } from 'lucide-react';

type UserType = {
  id: string;
  name: string;
  photoURL: string;
  isOnline?: boolean;
};

export const UserSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const { createChat } = useChat();
  
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setUsers([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data } = await userService.searchUsers(searchTerm);
        setUsers(data.users || []);
      } catch (error) {
        console.error('Error al buscar usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const handleSelectUser = (userId: string) => {
    createChat([userId]);
    setSearchTerm('');
  };
  
  return (
    <div className="mb-4 relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuario para chatear"
          className="pl-9"
        />
      </div>
      
      {searchTerm.trim() !== '' && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg">
          {loading ? (
            <div className="p-3 text-center text-sm">Buscando...</div>
          ) : users.length > 0 ? (
            <ul className="max-h-60 overflow-y-auto">
              {users.map(user => (
                <li
                  key={user.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer flex items-center"
                  onClick={() => handleSelectUser(user.id)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback className="bg-wfc-purple text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1">{user.name}</span>
                  {user.isOnline && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-center text-sm">No se encontraron usuarios</div>
          )}
        </div>
      )}
    </div>
  );
};
