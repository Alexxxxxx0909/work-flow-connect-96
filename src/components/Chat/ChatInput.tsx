
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChat } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, handleTyping } = useChat();
  
  const handleSend = async () => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    const success = await sendMessage(message);
    
    if (success) {
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
    
    setIsSubmitting(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enviar con Enter (sin Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
    
    // Ajustar altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  return (
    <div className="p-3 border-t bg-background flex items-end">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
        className={cn(
          "border-gray-300 resize-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-wfc-purple",
          "min-h-[50px] max-h-[150px] py-2"
        )}
        rows={1}
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={isSubmitting || !message.trim()}
        className="ml-2 bg-wfc-purple hover:bg-wfc-purple-medium h-10 w-10 rounded-full p-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};
