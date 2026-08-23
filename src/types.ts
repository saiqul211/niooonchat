export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email?: string;
  avatar_url?: string;
  status?: string;
  created_at: string;
}

export interface PublicProfile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  status?: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
}

export type AppRoute = 'welcome' | 'home' | 'search' | 'profile' | 'login' | 'signup' | 'chat';
