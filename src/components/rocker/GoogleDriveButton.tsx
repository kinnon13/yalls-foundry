import { Button } from "@/components/ui/button";
import { Cloud } from "lucide-react";
import { useState, useEffect } from "react";
import { GoogleDriveService } from "@/lib/ai/rocker/integrations/google-drive";
import { useToast } from "@/hooks/use-toast";

export function GoogleDriveButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [googleDriveService] = useState(() => new GoogleDriveService());
  const { toast } = useToast();

  useEffect(() => {
    setIsConnected(googleDriveService.isConnected());

    // Listen for OAuth callback
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'google-drive-auth' && event.data.code) {
        try {
          await googleDriveService.handleCallback(event.data.code);
          setIsConnected(true);
          toast({
            title: "Connected to Google Drive",
            description: "You can now access your Drive files through Rocker",
          });
        } catch (error) {
          toast({
            title: "Connection Failed",
            description: "Failed to connect to Google Drive",
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [googleDriveService, toast]);

  const handleConnect = async () => {
    try {
      const authUrl = await googleDriveService.connect();
      const width = 600;
      const height = 700;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      window.open(
        authUrl,
        'Google Drive Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate Google Drive connection",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    setIsConnected(false);
    toast({
      title: "Disconnected",
      description: "Google Drive has been disconnected",
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isConnected ? "default" : "outline"}
      onClick={isConnected ? handleDisconnect : handleConnect}
      title={isConnected ? "Disconnect Google Drive" : "Connect Google Drive"}
    >
      <Cloud className="h-4 w-4 mr-1" />
      {isConnected ? "Drive Connected" : "Connect Drive"}
    </Button>
  );
}
