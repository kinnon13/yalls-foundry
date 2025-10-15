import { supabase } from "@/integrations/supabase/client";

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
}

export class GoogleDriveService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('google-drive-access-token');
    this.refreshToken = localStorage.getItem('google-drive-refresh-token');
  }

  async connect(): Promise<string> {
    const { data, error } = await supabase.functions.invoke('google-drive-auth', {
      body: { action: 'get_auth_url' }
    });

    if (error) throw error;
    return data.authUrl;
  }

  async handleCallback(code: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('google-drive-auth', {
      body: { action: 'exchange_code', code }
    });

    if (error) throw error;

    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    // Save tokens
    localStorage.setItem('google-drive-access-token', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('google-drive-refresh-token', data.refreshToken);
    }
  }

  isConnected(): boolean {
    return !!this.accessToken;
  }

  disconnect(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('google-drive-access-token');
    localStorage.removeItem('google-drive-refresh-token');
  }

  async listFiles(query?: string): Promise<GoogleDriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    const { data, error } = await supabase.functions.invoke('google-drive-list', {
      body: { accessToken: this.accessToken, query }
    });

    if (error) throw error;
    return data.files;
  }

  async downloadFile(fileId: string, fileName: string): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Drive');
    }

    const { data, error } = await supabase.functions.invoke('google-drive-download', {
      body: { 
        accessToken: this.accessToken, 
        fileId,
        fileName 
      }
    });

    if (error) throw error;
    return data.url;
  }
}
