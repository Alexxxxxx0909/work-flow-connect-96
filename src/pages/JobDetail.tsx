import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import { useJobs, JobType } from '@/contexts/JobContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Calendar, DollarSign, User, Heart, Bookmark } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { CommentItem } from '@/components/Comments/CommentItem';

/**
 * Componente de la página de detalles de una propuesta
 */
const JobDetail = () => {
  // Hooks de React Router para obtener el ID de la propuesta y navegación
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  // Hooks de contexto para acceder a datos y funcionalidades
  const { getJob, addComment, toggleSavedJob, toggleLike, savedJobs, loadJobs } = useJobs(); // Funcionalidades de propuestas
  const { currentUser } = useAuth(); // Información del usuario actual
  const { findExistingPrivateChat, createPrivateChat } = useChat(); // Funcionalidades de chat
  const { getUserById } = useData(); // Para obtener datos de usuarios
  
  // Estados locales para el formulario de comentarios
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<JobType | null>(null);
  
  // Cargar trabajo cuando se monta el componente
  useEffect(() => {
    const loadJobDetails = async () => {
      if (!jobId) return;
      
      setIsLoading(true);
      try {
        // Importamos dinámicamente para evitar ciclos de dependencia
        const { getJobById } = await import('@/lib/jobService');
        const jobData = await getJobById(jobId);
        
        if (jobData) {
          setJob(jobData);
          console.log("Trabajo cargado:", jobData);
          console.log("Comentarios:", jobData.comments ? jobData.comments.length : 0);
        }
      } catch (error) {
        console.error("Error al cargar trabajo:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar la información de la propuesta"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadJobDetails();
  }, [jobId]);

  // Obtener información del propietario de la propuesta
  const jobOwner = job ? getUserById(job.userId) : undefined;
  // Verificar si la propuesta está guardada por el usuario actual
  const isJobSaved = job && savedJobs.includes(job.id);
  // Verificar si el usuario ha dado like a la propuesta
  const hasUserLiked = job && currentUser ? job.likes.includes(currentUser.id) : false;
  
  // Si está cargando, mostrar un indicador de carga
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-wfc-purple mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando propuesta...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Si no se encuentra la propuesta, mostrar mensaje de error
  if (!job) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Propuesta no encontrada</h2>
          <p className="text-gray-600 mt-2">La propuesta que estás buscando no existe o ha sido eliminada.</p>
          <Button className="mt-4" onClick={() => navigate('/jobs')}>
            Ver todas las propuestas
          </Button>
        </div>
      </MainLayout>
    );
  }

  /**
   * Función para manejar el botón de contacto
   * Verifica si ya existe un chat con el usuario y navega a él,
   * o crea uno nuevo si no existe
   */
  const handleContactClick = async () => {
    if (!currentUser || !job) return;
    
    try {
      // Buscar si ya existe un chat privado con este usuario
      const existingChat = findExistingPrivateChat(job.userId);
      
      if (existingChat) {
        // Si ya existe un chat, navegar a él
        navigate('/chats');
        toast({
          title: "Chat existente",
          description: `Continuando conversación con ${jobOwner?.name || 'usuario'}`
        });
      } else {
        // Si no existe, crear un nuevo chat privado
        await createPrivateChat(job.userId);
        navigate('/chats');
        toast({
          title: "Chat iniciado",
          description: `Has iniciado una conversación con ${jobOwner?.name || 'usuario'}`
        });
      }
    } catch (error) {
      console.error("Error al iniciar chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar el chat. Inténtalo de nuevo."
      });
    }
  };

  /**
   * Función para enviar un nuevo comentario a la propuesta
   */
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    
    setIsSubmittingComment(true);
    try {
      // Llamar a la función para añadir el comentario a la propuesta
      await addComment(job.id, commentText, currentUser);
      setCommentText(''); // Limpiar el campo de comentario
      
      // Recargar el trabajo para asegurarnos de mostrar los comentarios actualizados
      const { getJobById } = await import('@/lib/jobService');
      const updatedJob = await getJobById(job.id);
      if (updatedJob) {
        setJob(updatedJob);
        console.log("Trabajo actualizado después de comentario:", updatedJob);
        console.log("Comentarios actualizados:", updatedJob.comments?.length || 0);
      }
      
      toast({
        title: "Comentario enviado",
        description: "Tu comentario ha sido publicado correctamente"
      });
    } catch (error) {
      console.error("Error al enviar comentario:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar el comentario"
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * Función para guardar/quitar de guardados una propuesta
   */
  const handleToggleSave = () => {
    if (!currentUser || !job) return;
    
    toggleSavedJob(job.id, currentUser.id);
    toast({
      title: isJobSaved ? "Propuesta eliminada de guardados" : "Propuesta guardada",
      description: isJobSaved 
        ? "La propuesta ha sido eliminada de tus guardados" 
        : "La propuesta ha sido añadida a tus guardados"
    });
  };

  /**
   * Función para dar/quitar like a una propuesta
   */
  const handleToggleLike = () => {
    if (!currentUser || !job) return;
    
    toggleLike(job.id, currentUser.id);
  };

  /**
   * Función para formatear fechas (día/mes/año)
   */
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  /**
   * Función para formatear horas (hora:minutos)
   */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderizado del componente
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Cabecera con título y acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-gray-600 mt-1">
              Publicado por {job.userName} • {formatDate(job.timestamp)}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Badge que muestra el estado de la propuesta */}
            <Badge className={`
              ${job.status === 'open' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                job.status === 'in-progress' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : 
                'bg-gray-100 text-gray-800 hover:bg-gray-200'}
            `}>
              {job.status === 'open' ? 'Abierto' : 
               job.status === 'in-progress' ? 'En progreso' : 
               'Completado'}
            </Badge>
            
            {/* Botones de like y guardar, solo para usuarios autenticados */}
            {currentUser && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleToggleLike}
                  className={hasUserLiked ? "text-red-500" : "text-gray-400"}
                >
                  <Heart className={`h-5 w-5 ${hasUserLiked ? "fill-red-500" : ""}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleToggleSave}
                  className={isJobSaved ? "text-wfc-purple" : "text-gray-400"}
                >
                  <Bookmark className={`h-5 w-5 ${isJobSaved ? "fill-wfc-purple" : ""}`} />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Layout principal con contenido y sidebar */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Columna principal (2/3 del ancho) */}
          <div className="md:col-span-2 space-y-6">
            {/* Tarjeta de descripción de la propuesta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                
                {/* Sección de habilidades requeridas */}
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Habilidades requeridas</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="bg-gray-50">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Contador de likes */}
                <div className="mt-4 flex items-center">
                  <Heart className={`h-5 w-5 mr-1 ${job.likes.length > 0 ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
                  <span className="text-sm">{job.likes.length} {job.likes.length === 1 ? "like" : "likes"}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Tarjeta de comentarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comentarios</CardTitle>
                <CardDescription>
                  {job.comments.length === 0 ? 'No hay comentarios aún' : `${job.comments.length} comentarios`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Lista de comentarios existentes */}
                {job.comments && job.comments.length > 0 ? (
                  <div className="space-y-4 mb-6">
                    {job.comments.map((comment) => (
                      <CommentItem key={comment.id} comment={comment} jobId={job.id} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-6">Aún no hay comentarios en esta propuesta. ¡Sé el primero en comentar!</p>
                )}
                
                {/* Formulario para añadir un nuevo comentario (solo para usuarios autenticados) */}
                {currentUser && job.status === 'open' && (
                  <div className="space-y-4">
                    <Separator />
                    <h3 className="text-sm font-medium">Deja un comentario</h3>
                    <Textarea
                      placeholder="Escribe tu comentario aquí..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <Button 
                      onClick={handleSubmitComment} 
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="bg-wfc-purple hover:bg-wfc-purple-medium"
                    >
                      {isSubmittingComment ? 'Enviando...' : 'Enviar comentario'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar (1/3 del ancho) */}
          <div className="space-y-6">
            {/* Tarjeta con detalles de la propuesta */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles de la propuesta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Presupuesto */}
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h4 className="text-sm text-gray-600">Presupuesto</h4>
                    <p className="font-medium">${job.budget}</p>
                  </div>
                </div>
                {/* Fecha de publicación */}
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <h4 className="text-sm text-gray-600">Fecha de publicación</h4>
                    <p className="font-medium">{formatDate(job.timestamp)}</p>
                  </div>
                </div>
                {/* Categoría */}
                <div className="flex items-center">
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 mr-2">
                    {job.category}
                  </Badge>
                  <span className="text-sm text-gray-600">Categoría</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Tarjeta con información del cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información básica del cliente */}
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={job.userPhoto} alt={job.userName} />
                    <AvatarFallback className="bg-wfc-purple-medium text-white">
                      {job.userName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{job.userName}</p>
                  </div>
                </div>
                
                {/* Botón de contacto (solo para usuarios autenticados que no son el dueño) */}
                {currentUser && currentUser.id !== job.userId && (
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-wfc-purple text-wfc-purple hover:bg-wfc-purple/10"
                    onClick={handleContactClick}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contactar
                  </Button>
                )}
                
                {/* Botón para ver perfil completo */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/user/${job.userId}`)}
                >
                  <User className="h-4 w-4 mr-2" />
                  Ver perfil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default JobDetail;
