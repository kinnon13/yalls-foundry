/**
 * Message Button - Direct message action for profiles
 */

import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface MessageButtonProps {
  recipientId: string;
  recipientName: string;
}

export function MessageButton({ recipientId, recipientName }: MessageButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMessage = () => {
    // Navigate to messages with the recipient pre-selected
    navigate(`/messages?to=${recipientId}`);
    toast({
      title: 'Opening messages',
      description: `Start a conversation with ${recipientName}`,
    });
  };

  return (
    <Button
      onClick={handleMessage}
      variant="default"
      size="lg"
      className="w-full sm:w-auto"
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      Message
    </Button>
  );
}
