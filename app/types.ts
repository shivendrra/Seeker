import type { User as FirebaseUser } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

// Re-exporting the FirebaseUser type for use in the app
export type User = FirebaseUser;

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Timestamp;
  sources?: Source[];
  trace?: any;
}

export interface Source {
  id: string;
  title: string;
  date: string;
  type: string;
  url?: string;
}

export interface ChatSession {
  id:string;
  userId: string;
  title: string;
  createdAt: Timestamp;
}

export interface UserProfileData {
    displayName: string;
    profession?: string;
    description?: string;
}
