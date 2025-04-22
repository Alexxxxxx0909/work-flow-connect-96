
import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Verificar inicialmente
    checkIsMobile();
    
    // Añadir listener para cambios de tamaño de ventana
    window.addEventListener('resize', checkIsMobile);
    
    // Limpiar listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};
