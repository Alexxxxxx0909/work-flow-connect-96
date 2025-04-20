
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, UserIcon } from 'lucide-react';
import { CommentType, useJobs } from '@/contexts/JobContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

type CommentItemProps = {
  comment: CommentType;
  jobId: string;
};

export const CommentItem: React.FC<CommentItemProps> = ({ comment, jobId }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  const { currentUser } = useAuth();
  const { addReplyToComment } = useJobs();

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || !currentUser) return;
    
    setIsSubmittingReply(true);
    try {
      await addReplyToComment(jobId, comment.id, replyContent, currentUser);
      setReplyContent('');
      setShowReplyForm(false);
      
      // Mostrar toast de éxito
      toast({
        title: "Respuesta enviada",
        description: "Tu respuesta ha sido publicada correctamente"
      });
      
      // Recargar la página para mostrar la nueva respuesta
      // Esta es una solución temporal, idealmente deberíamos actualizar el estado
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error("Error al enviar respuesta:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la respuesta. Inténtalo de nuevo."
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-3">
      {/* Comentario principal */}
      <div className="flex space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.userPhoto} alt={comment.userName} />
          <AvatarFallback className="bg-wfc-purple-medium text-white">
            {comment.userName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between">
            <h4 className="font-medium text-sm">{comment.userName}</h4>
            <span className="text-xs text-gray-500">
              {formatDate(comment.timestamp)} {formatTime(comment.timestamp)}
            </span>
          </div>
          <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
          
          {currentUser && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-xs text-wfc-purple mt-1 flex items-center"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {showReplyForm ? 'Cancelar' : 'Responder'}
            </button>
          )}
        </div>
      </div>

      {/* Formulario de respuesta */}
      {showReplyForm && (
        <div className="ml-11 mt-2">
          <Textarea
            placeholder="Escribe tu respuesta..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              variant="outline"
              className="mr-2"
              onClick={() => setShowReplyForm(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReply}
              disabled={isSubmittingReply || !replyContent.trim()}
              className="bg-wfc-purple hover:bg-wfc-purple-medium"
            >
              {isSubmittingReply ? 'Enviando...' : 'Responder'}
            </Button>
          </div>
        </div>
      )}

      {/* Respuestas */}
      {comment.replies.length > 0 && (
        <div className="ml-11 space-y-3 border-l-2 border-gray-100 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="flex space-x-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={reply.userPhoto} alt={reply.userName} />
                <AvatarFallback className="bg-wfc-purple-light text-white text-xs">
                  {reply.userName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium text-xs">{reply.userName}</h4>
                  <span className="text-xs text-gray-500">
                    {formatDate(reply.timestamp)} {formatTime(reply.timestamp)}
                  </span>
                </div>
                <p className="text-gray-700 text-xs mt-1">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
