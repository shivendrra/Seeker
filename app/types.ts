// Fix: Use Firebase v9 compatibility import for User type.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { type Timestamp } from "firebase/firestore";

// Re-exporting the FirebaseUser type for use in the app
export type User = firebase.User;

export interface TraceStep {
  tool: string;
  input: string;
  output: string;
}

export interface Trace {
  plan: string[];
  steps: TraceStep[];
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Timestamp;
  sources?: Source[];
  trace?: Trace;
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

export interface UserSettings {
  defaultJurisdiction: string;
  defaultDocTypes: string; // Comma-separated values
  showTrace: boolean;
  defaultDateFilter: string;
  defaultSummaryStyle: 'Key Points' | 'Brief' | 'Detailed';
  enableMemory: boolean;
  language: string;
  theme: 'light' | 'dark';
}

export interface UserProfileData {
    displayName: string;
    profession?: string;
    description?: string;
    settings?: UserSettings;
}

export interface UserProfile extends UserProfileData {
    uid: string;
    email: string | null;
}