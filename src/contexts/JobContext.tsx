
/**
 * Contexto de Trabajos
 * 
 * Este contexto proporciona funcionalidades relacionadas con la gestión de trabajos:
 * - Listar, crear, actualizar y eliminar trabajos
 * - Gestionar comentarios y respuestas en trabajos
 * - Manejar likes y guardados de trabajos
 * - Proporcionar acceso a los datos de trabajos en toda la aplicación
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { UserType } from '@/contexts/DataContext';
import { 
  getAllJobs, 
  getJobById, 
  createJob as createJobService,
  updateJob as updateJobService,
  deleteJob as deleteJobService,
  addCommentToJob, 
  addReplyToComment as addReplyToCommentService,
  toggleJobLike as toggleJobLikeService,
  toggleSavedJob as toggleSavedJobService,
  getSavedJobs as getSavedJobsService
} from '@/lib/jobService';
import { toast } from '@/components/ui/use-toast';

export type ReplyType = {
  id: string;           // ID único de la respuesta
  commentId: string;    // ID del comentario al que responde
  userId: string;       // ID del usuario que creó la respuesta
  userName: string;     // Nombre del usuario que creó la respuesta
  userPhoto?: string;   // Foto de perfil del usuario (opcional)
  content: string;      // Contenido de la respuesta
  timestamp: number;    // Marca de tiempo cuando se creó la respuesta
};

export type CommentType = {
  id: string;           // ID único del comentario
  jobId: string;        // ID del trabajo al que pertenece el comentario
  userId: string;       // ID del usuario que creó el comentario
  userName: string;     // Nombre del usuario que creó el comentario
  userPhoto?: string;   // Foto de perfil del usuario (opcional)
  content: string;      // Contenido del comentario
  timestamp: number;    // Marca de tiempo cuando se creó el comentario
  replies: ReplyType[]; // Lista de respuestas al comentario
};

export type JobType = {
  id: string;           // ID único del trabajo
  title: string;        // Título del trabajo
  description: string;  // Descripción detallada del trabajo
  budget: number;       // Presupuesto asignado al trabajo
  category: string;     // Categoría a la que pertenece el trabajo
  skills: string[];     // Habilidades requeridas para el trabajo
  userId: string;       // ID del usuario que creó el trabajo
  userName: string;     // Nombre del usuario que creó el trabajo
  userPhoto?: string;   // Foto de perfil del usuario (opcional)
  timestamp: number;    // Marca de tiempo cuando se creó el trabajo
  status: 'open' | 'in-progress' | 'completed' | 'assigned' | 'cancelled'; // Estado actual del trabajo
  comments: CommentType[]; // Comentarios en el trabajo
  likes: string[];      // Array de IDs de usuarios que dieron like
  createdAt?: string;   // Fecha de creación (formato ISO)
  updatedAt?: string;   // Fecha de última actualización (formato ISO)
};

type JobContextType = {
  jobs: JobType[];      // Lista de todos los trabajos disponibles
  loading: boolean;     // Indica si los datos están cargando
  createJob: (jobData: Omit<JobType, 'id' | 'timestamp' | 'comments' | 'likes'>) => Promise<JobType>; // Crear nuevo trabajo
  updateJob: (jobId: string, jobData: Partial<JobType>) => Promise<JobType>; // Actualizar trabajo existente
  deleteJob: (jobId: string) => Promise<boolean>; // Eliminar trabajo
  addComment: (jobId: string, content: string, user: UserType) => Promise<void>; // Añadir comentario a un trabajo
  addReplyToComment: (jobId: string, commentId: string, content: string, user: UserType) => Promise<void>; // Añadir respuesta a comentario
  getJob: (jobId: string) => JobType | undefined; // Obtener un trabajo por su ID
  toggleSavedJob: (jobId: string, userId: string) => void; // Guardar/eliminar un trabajo de favoritos
  getSavedJobs: (userId: string) => Promise<JobType[]>; // Obtener trabajos guardados por un usuario
  toggleLike: (jobId: string, userId: string) => void; // Dar/quitar like a un trabajo
  savedJobs: string[]; // Array de IDs de trabajos guardados por el usuario actual
  loadJobs: () => Promise<void>; // Método para recargar trabajos
};

// Tipos para el contexto
interface DataContextType {
  getUserById: (userId: string) => UserType | undefined;
  getAllUsers: () => UserType[];
  jobCategories: string[];
  skillsList: string[];
}

const JobContext = createContext<JobContextType | null>(null);

/**
 * Hook personalizado para acceder al contexto de trabajos
 */
export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs debe usarse dentro de un JobProvider');
  }
  return context;
};

interface JobProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de trabajos
 * Proporciona funcionalidad y estado relacionados con los trabajos
 */
export const JobProvider: React.FC<JobProviderProps> = ({ children }) => {
  const [jobs, setJobs] = useState<JobType[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  /**
   * Función para cargar todos los trabajos
   */
  const loadJobs = async () => {
    setLoading(true);
    try {
      const jobsData = await getAllJobs();
      // Aseguramos que todos los trabajos tienen los campos requeridos
      const formattedJobs: JobType[] = jobsData.map(job => ({
        ...job,
        likes: job.likes || [],
        comments: job.comments || [],
        timestamp: job.timestamp || new Date(job.createdAt || Date.now()).getTime(),
        userName: job.userName || "Usuario",
        status: job.status || 'open'
      }));
      setJobs(formattedJobs);
    } catch (error) {
      console.error("Error al cargar trabajos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar trabajos iniciales al montar el componente
  useEffect(() => {
    loadJobs();
  }, []);

  /**
   * Función para crear un nuevo trabajo
   */
  const createJob = async (jobData: Omit<JobType, 'id' | 'timestamp' | 'comments' | 'likes'>) => {
    try {
      console.log('Creating job with data:', jobData);
      const newJob = await createJobService(jobData);
      
      // Aseguramos que tenga todos los campos necesarios
      const formattedJob: JobType = {
        ...newJob,
        likes: [],
        comments: [],
        timestamp: newJob.timestamp || new Date(newJob.createdAt || Date.now()).getTime(),
        status: newJob.status as JobType['status']
      };
      
      setJobs(prevJobs => [...prevJobs, formattedJob]);
      toast({
        title: "Éxito",
        description: "La propuesta se ha creado correctamente."
      });
      return formattedJob;
    } catch (error) {
      console.error("Error al crear trabajo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al crear la propuesta. Inténtalo de nuevo."
      });
      throw error;
    }
  };

  /**
   * Función para actualizar un trabajo existente
   */
  const updateJob = async (jobId: string, jobData: Partial<JobType>) => {
    try {
      // Aquí convertimos el estado si es necesario
      if (jobData.status) {
        const status = jobData.status as JobType['status'];
        jobData.status = status;
      }
      
      const updatedJob = await updateJobService(jobId, jobData);
      
      // Aseguramos que tenga todos los campos necesarios
      const formattedJob: JobType = {
        ...updatedJob,
        likes: updatedJob.likes || [],
        comments: updatedJob.comments || [],
        timestamp: updatedJob.timestamp || new Date(updatedJob.createdAt || Date.now()).getTime(),
        status: updatedJob.status as JobType['status']
      };
      
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId ? formattedJob : job
      ));
      
      return formattedJob;
    } catch (error) {
      console.error("Error al actualizar trabajo:", error);
      throw error;
    }
  };

  /**
   * Función para eliminar un trabajo
   */
  const deleteJob = async (jobId: string) => {
    try {
      const success = await deleteJobService(jobId);
      
      if (success) {
        // Actualizar el estado local eliminando el trabajo
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        toast({
          title: "Éxito",
          description: "La propuesta ha sido eliminada correctamente."
        });
        return true;
      } else {
        throw new Error('No se pudo eliminar la propuesta');
      }
    } catch (error) {
      console.error("Error al eliminar trabajo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la propuesta. Inténtalo de nuevo."
      });
      return false;
    }
  };

  /**
   * Función para añadir un comentario a un trabajo
   */
  const addComment = async (jobId: string, content: string, user: UserType) => {
    try {
      const newComment = await addCommentToJob(jobId, content, user);
      
      // Asegurar que el comentario tiene el formato correcto
      const formattedComment: CommentType = {
        ...newComment,
        userName: newComment.userName || user.name,
        timestamp: newComment.timestamp || Date.now(),
        replies: newComment.replies || []
      };
      
      // Actualizar el estado local
      setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId 
          ? { ...job, comments: [...job.comments, formattedComment] }
          : job
      ));
      
      // Recargamos el trabajo para asegurar que tenemos la última versión con todos los comentarios
      try {
        const updatedJob = await getJobById(jobId);
        if (updatedJob) {
          console.log("Trabajo actualizado después de añadir comentario:", updatedJob);
          console.log("Comentarios en el trabajo actualizado:", updatedJob.comments?.length || 0);
          setJobs(prevJobs => prevJobs.map(job => 
            job.id === jobId ? updatedJob : job
          ));
        }
      } catch (refreshError) {
        console.error("Error al refrescar el trabajo después de añadir comentario:", refreshError);
      }
    } catch (error) {
      console.error("Error al añadir comentario:", error);
      throw error;
    }
  };

  /**
   * Función para añadir una respuesta a un comentario
   */
  const addReplyToComment = async (jobId: string, commentId: string, content: string, user: UserType) => {
    try {
      const newReply = await addReplyToCommentService(jobId, commentId, content, user);
      
      if (!newReply) return;
      
      // Asegurar que la respuesta tiene el formato correcto
      const formattedReply: ReplyType = {
        ...newReply,
        userName: newReply.userName || user.name,
        timestamp: newReply.timestamp || Date.now()
      };
      
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id !== jobId) return job;
        
        return {
          ...job,
          comments: job.comments.map(comment => 
            comment.id === commentId
              ? { ...comment, replies: [...comment.replies, formattedReply] }
              : comment
          )
        };
      }));
    } catch (error) {
      console.error("Error al añadir respuesta:", error);
      throw error;
    }
  };

  /**
   * Función para obtener un trabajo por su ID
   */
  const getJob = (jobId: string) => {
    return jobs.find(job => job.id === jobId);
  };

  /**
   * Función para guardar/eliminar un trabajo de favoritos
   */
  const toggleSavedJob = async (jobId: string, userId: string) => {
    try {
      const isNowSaved = await toggleSavedJobService(userId, jobId);
      
      setSavedJobs(prev => {
        if (isNowSaved) {
          return [...prev, jobId];
        } else {
          return prev.filter(id => id !== jobId);
        }
      });
    } catch (error) {
      console.error("Error al marcar/desmarcar trabajo guardado:", error);
    }
  };

  /**
   * Función para obtener trabajos guardados por un usuario
   */
  const getSavedJobs = async (userId: string) => {
    try {
      const savedJobsData = await getSavedJobsService(userId);
      const savedJobIds = savedJobsData.map(job => job.id);
      setSavedJobs(savedJobIds);
      return savedJobsData;
    } catch (error) {
      console.error("Error al obtener trabajos guardados:", error);
      return [];
    }
  };

  /**
   * Función para dar/quitar like a un trabajo
   */
  const toggleLike = async (jobId: string, userId: string) => {
    try {
      const isNowLiked = await toggleJobLikeService(jobId, userId);
      
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id !== jobId) return job;
        
        const likes = isNowLiked
          ? [...job.likes, userId]
          : job.likes.filter(id => id !== userId);
        
        return {
          ...job,
          likes
        };
      }));
    } catch (error) {
      console.error("Error al marcar/desmarcar me gusta:", error);
    }
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        loading,
        createJob,
        updateJob,
        deleteJob,
        addComment,
        addReplyToComment,
        getJob,
        toggleSavedJob,
        getSavedJobs,
        toggleLike,
        savedJobs,
        loadJobs
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export {};
